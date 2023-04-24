"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSendChat = void 0;
async function ApiSendChat(call) {
    const conn = call.conn;
    const room = conn.currentRoom;
    const currentUser = conn.currentUser;
    room.broadcastMsg('serverMsg/Chat', {
        time: new Date,
        content: call.req.content,
        user: currentUser
    });
    call.succ({});
}
exports.ApiSendChat = ApiSendChat;
