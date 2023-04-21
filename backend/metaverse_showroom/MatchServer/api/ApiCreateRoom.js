"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiCreateRoom = void 0;
const matchServer_1 = require("../../matchServer");
async function ApiCreateRoom(call) {
    // 参数校验
    if (!call.req.roomName) {
        return call.error('请输入房间名称');
    }
    let ret = await matchServer_1.matchServer.createRoom(call.req.roomName);
    ret.isSucc ? call.succ(ret.res) : call.error(ret.err);
}
exports.ApiCreateRoom = ApiCreateRoom;
