"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiJoinRoom = void 0;
const uuid = __importStar(require("uuid"));
const roomServer_1 = require("../../roomServer");
async function ApiJoinRoom(call) {
    // Login
    const currentUser = {
        id: uuid.v4(),
        nickName: call.req.nickname,
        headImg: call.req.headImg,
        openId: call.req.openId,
        skin: call.req.skin,
    };
    const conn = call.conn;
    conn.currentUser = currentUser;
    let room = roomServer_1.roomServer.id2Room.get(call.req.roomId);
    if (!room) {
        return call.error('房间不存在', { code: 'ROOM_NOT_EXISTS' });
    }
    if (room.data.users.length >= room.data.maxUser) {
        return call.error('该房间已满员');
    }
    // 用户已经在本房间中，可能是通过其它设备登录，踢出旧连接
    let existedConns = room.conns.filter(v => v.currentUser.openId === currentUser.openId);
    existedConns.forEach(v => {
        room.leave(v);
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
    });
}
exports.ApiJoinRoom = ApiJoinRoom;
