import { PrefixLogger } from "tsrpc";
import { roomServer } from "../../roomServer";
import { GameSystem, GameSystemInput, PlayerJoin } from "../../shared/game/GameSystem";
import { RoomData } from "../../shared/game/RoomData";
import { RoomUserState } from "../../shared/game/state/RoomUserState";
import { UserInfo } from "../../shared/game/state/UserInfo";
import { MsgUpdateRoomState } from "../../shared/protocols/roomServer/admin/MsgUpdateRoomState";
import { ServiceType } from "../../shared/protocols/serviceProto_roomServer";
import { RoomServerConn } from "../RoomServer";

export class Room {

    data: RoomData;
    conns: RoomServerConn[] = [];
    // userStates: {
    //     [uid: string]: RoomUserState
    // } = {};
    logger: PrefixLogger;

    pendingInputs: GameSystemInput[] = [];
    gameSystem = new GameSystem();
    playerLastSn: { [playerId: string]: number | undefined } = {};
    lastSyncTime?: number;

    constructor(data: RoomData) {
        this.data = data;

        this.logger = new PrefixLogger({
            logger: roomServer.logger,
            prefixs: [`[Room ${data.id}]`],
        });

        // 每 100ms 同步一次 UserState
        this._setInterval(() => {
            // this.broadcastMsg('serverMsg/UserStates', {
            //     userStates: this.userStates
            // })
            this.sync();
        }, 100);
    }

    get state(): MsgUpdateRoomState['rooms'][number] {
        return {
            id: this.data.id,
            name: this.data.name,
            userNum: this.conns.length,
            maxUserNum: this.data.maxUser,
            /** 为 undefined 代表不在匹配中 */
            startMatchTime: this.data.startMatchTime,
            // 房间信息的最后更新时间
            updateTime: this.data.updateTime
        }
    }

    /** 房间内广播 */
    broadcastMsg<T extends keyof ServiceType['msg']>(msgName: T, msg: ServiceType['msg'][T]) {
        return roomServer.server.broadcastMsg(msgName, msg, this.conns);
    }

    listenMsgs(conn: RoomServerConn, userInfo: UserInfo) {
        // conn.listenMsg('clientMsg/UserState', call => {
        //     const conn = call.conn as RoomServerConn;
        //     this.userStates[conn.currentUser.id] = conn.currentRoom.userStates[conn.currentUser.id];
        // });
        let input: PlayerJoin = {
            type: 'PlayerJoin',
            userInfo: userInfo,
            // 初始位置随机
            pos: {
                x: Math.random() * 9 - 4,
                y: Math.random() * 2 + 11.5
            }
        }
        this.applyInput(input);
        conn.listenMsg('clientMsg/ClientInput', call => {
            this.playerLastSn[input.userInfo.id] = call.msg.sn;
            call.msg.inputs.forEach(v => {
                this.applyInput({
                    ...v,
                    userInfo: input.userInfo
                });
            })
        });
    }
    unlistenMsgs(conn: RoomServerConn) {
        // conn.unlistenMsgAll('clientMsg/UserState');
        conn.unlistenMsgAll('clientMsg/ClientInput');
    }

    applyInput(input: GameSystemInput) {
        this.pendingInputs.push(input);
    }

    sync() {
        let inputs = this.pendingInputs;
        this.pendingInputs = [];

        // Apply inputs
        inputs.forEach(v => {
            this.gameSystem.applyInput(v)
        });

        // Apply TimePast
        let now = process.uptime() * 1000;
        this.applyInput({
            type: 'TimePast',
            dt: now - (this.lastSyncTime ?? now)
        });
        this.lastSyncTime = now;

        // 发送同步帧
        this.conns.forEach(v => {
            v.sendMsg('serverMsg/Frame', {
                inputs: inputs,
                lastSn: this.playerLastSn[v.currentUser!.id]
            })
        });
    }

    leave(conn: RoomServerConn) {
        const currentUser = conn.currentUser;
        this.logger.log('[UserLeave]', currentUser?.openId);

        this.conns.removeOne(v => v === conn);
        this.data.users.removeOne(v => v.openId === currentUser.openId);
        // delete this.userStates[currentUser.id]
        this.data.updateTime = Date.now();

        if (conn) {
            conn.close();
            this.unlistenMsgs(conn);
        }

        if (currentUser) {
            // this.broadcastMsg('serverMsg/UserExit', {
            //     time: new Date,
            //     user: currentUser!
            // })
            this.applyInput({
                type: 'PlayerLeave',
                userInfo: currentUser
            });
        }

        if (this.conns.length === 0) {
            this.data.lastEmptyTime = Date.now();
        }
    }

    destroy() {
        this.logger.log('[Destroy]');
        this._intervals.forEach(v => { clearInterval(v) });
        this._intervals = [];

        roomServer.rooms.removeOne(v => v === this);
        roomServer.id2Room.delete(this.data.id);
    }

    private _intervals: ReturnType<typeof setInterval>[] = [];
    private _setInterval(func: () => void, interval: number) {
        this._intervals.push(setInterval(func, interval))
    }

}