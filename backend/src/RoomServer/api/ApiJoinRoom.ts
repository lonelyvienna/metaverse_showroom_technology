import { ApiCall } from "tsrpc";
import * as uuid from 'uuid';
import { roomServer } from "../../roomServer";
import { UserInfo } from "../../shared/game/state/UserInfo";
import { ReqJoinRoom, ResJoinRoom } from "../../shared/protocols/roomServer/PtlJoinRoom";
import { RoomServerConn } from "../RoomServer";

export async function ApiJoinRoom(call: ApiCall<ReqJoinRoom, ResJoinRoom>) {
    // Login
    const currentUser: UserInfo = {
        id: uuid.v4(),
        nickName: call.req.nickname,
        headImg: call.req.headImg,
        openId: call.req.openId,
        skin: call.req.skin,
    }
    const conn = call.conn as RoomServerConn;
    conn.currentUser = currentUser;

    let room = roomServer.id2Room.get(call.req.roomId);
    if (!room) {
        return call.error('房间不存在', { code: 'ROOM_NOT_EXISTS' });
    }

    if (room.data.users.length >= room.data.maxUser) {
        return call.error('该房间已满员');
    }

    // 用户已经在本房间中，可能是通过其它设备登录，踢出旧连接
    let existedConns = room.conns.filter(v => v.currentUser!.openId === currentUser.openId);
    existedConns.forEach(v => {
        room!.leave(v)
    });
    // 用户正在其它房间中，从已有房间中退出
    if (conn.currentRoom) {
        conn.currentRoom.leave(conn);
    }

    room.conns.push(conn);
    room.data.users.push({
        ...currentUser
    });
    // room.userStates[currentUser.id] = {
    //     type: 'walk',
    //     userInfo: currentUser,
    //     pos: {
    //         x: Math.random() * 4 - 2,
    //         y: Math.random() * 9 + 5
    //     },
    //     cameraRotateY: 0
    // }
    conn.currentRoom = room;
    room.listenMsgs(conn, currentUser);
    room.data.lastEmptyTime = undefined;
    room.data.updateTime = Date.now();

    call.succ({
        roomData: room.data,
        currentUser: currentUser,
        gameState: room.gameSystem.state
    });

    room.broadcastMsg('serverMsg/UserJoin', {
        time: new Date,
        user: currentUser
    })
}