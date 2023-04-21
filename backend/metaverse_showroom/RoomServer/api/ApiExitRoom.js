"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExitRoom = void 0;
async function ApiExitRoom(call) {
    const conn = call.conn;
    if (conn.currentRoom) {
        conn.currentRoom.leave(conn);
    }
    call.succ({});
}
exports.ApiExitRoom = ApiExitRoom;
