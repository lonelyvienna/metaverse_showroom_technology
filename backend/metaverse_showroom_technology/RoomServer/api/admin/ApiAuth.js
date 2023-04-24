"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAuth = void 0;
const BackConfig_1 = require("../../../models/BackConfig");
const roomServer_1 = require("../../../roomServer");
async function ApiAuth(call) {
    if (call.req.type === 'MatchServer') {
        let conn = call.conn;
        roomServer_1.roomServer.matchServerConn = conn;
        conn.matchServer = {
            // 定时 Send State
            intervalSendState: setInterval(() => {
                conn.sendMsg('admin/UpdateRoomState', {
                    connNum: roomServer_1.roomServer.server.connections.length,
                    rooms: roomServer_1.roomServer.rooms.map(v => v.state)
                });
            }, BackConfig_1.BackConfig.roomServer.intervalSendState)
        };
    }
    call.succ({});
}
exports.ApiAuth = ApiAuth;
