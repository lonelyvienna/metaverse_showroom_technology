"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSsoWs = void 0;
/**
 * 登录态校验，WebSocket 与 HTTP 不同，登录态直接存在 Connection 上
 */
function useSsoWs(server) {
    server.flows.preApiCallFlow.push(async (call) => {
        const conn = call.conn;
        // 部分接口需要登录和加入房间后才可使用
        if (!call.service.name.startsWith('admin/') && call.service.name !== 'JoinRoom') {
            if (!conn.currentUser) {
                call.error('你还未登录', { code: 'NEED_LOGIN' });
                return undefined;
            }
            if (!conn.currentRoom) {
                call.error('尚未加入房间', { code: 'NO_ROOM' });
                return undefined;
            }
        }
        return call;
    });
}
exports.useSsoWs = useSsoWs;
