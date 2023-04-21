"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCleanConn = void 0;
const roomServer_1 = require("../../../roomServer");
/** MatchServer 断开后清理 */
function useCleanConn(server) {
    server.flows.postDisconnectFlow.push(v => {
        let conn = v.conn;
        // 退出已加入的房间
        if (conn.currentRoom) {
            conn.currentRoom.leave(conn);
        }
        // MatchServer 清空定时器
        if (conn.matchServer) {
            clearInterval(conn.matchServer.intervalSendState);
            if (roomServer_1.roomServer.matchServerConn === conn) {
                roomServer_1.roomServer.matchServerConn = undefined;
            }
        }
        return v;
    });
}
exports.useCleanConn = useCleanConn;
