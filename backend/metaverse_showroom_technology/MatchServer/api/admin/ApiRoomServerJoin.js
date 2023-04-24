"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRoomServerJoin = void 0;
const matchServer_1 = require("../../../matchServer");
const BackConfig_1 = require("../../../models/BackConfig");
async function ApiRoomServerJoin(call) {
    // 鉴权
    if (call.req.adminToken !== BackConfig_1.BackConfig.adminToken) {
        return call.error('非法操作');
    }
    await matchServer_1.matchServer.joinRoomServer(call.req.serverUrl);
    call.succ({});
}
exports.ApiRoomServerJoin = ApiRoomServerJoin;
