"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const tsrpc_1 = require("tsrpc");
const roomServer_1 = require("../../roomServer");
const GameSystem_1 = require("../../shared/game/GameSystem");
class Room {
    constructor(data) {
        this.conns = [];
        this.pendingInputs = [];
        this.gameSystem = new GameSystem_1.GameSystem();
        this.playerLastSn = {};
        this._intervals = [];
        this.data = data;
        this.logger = new tsrpc_1.PrefixLogger({
            logger: roomServer_1.roomServer.logger,
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
    get state() {
        return {
            id: this.data.id,
            name: this.data.name,
            userNum: this.conns.length,
            maxUserNum: this.data.maxUser,
            /** 为 undefined 代表不在匹配中 */
            startMatchTime: this.data.startMatchTime,
            // 房间信息的最后更新时间
            updateTime: this.data.updateTime
        };
    }
    /** 房间内广播 */
    broadcastMsg(msgName, msg) {
        return roomServer_1.roomServer.server.broadcastMsg(msgName, msg, this.conns);
    }
    listenMsgs(conn, userInfo) {
        // conn.listenMsg('clientMsg/UserState', call => {
        //     const conn = call.conn as RoomServerConn;
        //     this.userStates[conn.currentUser.id] = conn.currentRoom.userStates[conn.currentUser.id];
        // });
        let input = {
            type: 'PlayerJoin',
            userInfo: userInfo,
            // 初始位置随机
            pos: {
                x: Math.random() * 9 - 4,
                y: Math.random() * 2 + 11.5
            }
        };
        this.applyInput(input);
        conn.listenMsg('clientMsg/ClientInput', call => {
            this.playerLastSn[input.userInfo.id] = call.msg.sn;
            call.msg.inputs.forEach(v => {
                this.applyInput({
                    ...v,
                    userInfo: input.userInfo
                });
            });
        });
    }
    unlistenMsgs(conn) {
        // conn.unlistenMsgAll('clientMsg/UserState');
        conn.unlistenMsgAll('clientMsg/ClientInput');
    }
    applyInput(input) {
        this.pendingInputs.push(input);
    }
    sync() {
        var _a;
        let inputs = this.pendingInputs;
        this.pendingInputs = [];
        // Apply inputs
        inputs.forEach(v => {
            this.gameSystem.applyInput(v);
        });
        // Apply TimePast
        let now = process.uptime() * 1000;
        this.applyInput({
            type: 'TimePast',
            dt: now - ((_a = this.lastSyncTime) !== null && _a !== void 0 ? _a : now)
        });
        this.lastSyncTime = now;
        // 发送同步帧
        this.conns.forEach(v => {
            v.sendMsg('serverMsg/Frame', {
                inputs: inputs,
                lastSn: this.playerLastSn[v.currentUser.id]
            });
        });
    }
    leave(conn) {
        const currentUser = conn.currentUser;
        this.logger.log('[UserLeave]', currentUser === null || currentUser === void 0 ? void 0 : currentUser.openId);
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
        this._intervals.forEach(v => { clearInterval(v); });
        this._intervals = [];
        roomServer_1.roomServer.rooms.removeOne(v => v === this);
        roomServer_1.roomServer.id2Room.delete(this.data.id);
    }
    _setInterval(func, interval) {
        this._intervals.push(setInterval(func, interval));
    }
}
exports.Room = Room;
