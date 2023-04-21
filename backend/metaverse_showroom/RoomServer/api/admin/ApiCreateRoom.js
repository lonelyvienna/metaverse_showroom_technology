"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCreateRoom = void 0;
const roomServer_1 = require("../../../roomServer");
async function ApiCreateRoom(call) {
    let room = roomServer_1.roomServer.createRoom(call.req.roomName);
    call.succ({
        roomId: room.data.id
    });
}
exports.ApiCreateRoom = ApiCreateRoom;
