"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackConfig = void 0;
exports.BackConfig = {
    adminToken: 'AAABBBCCC',
    roomServer: {
        /** 发送房间状态的时间间隔 */
        intervalSendState: 3000,
        /** 每个房间的最大人数 */
        maxRoomUserNum: 30
    },
    matchServer: {
        /** 执行匹配的间隔 */
        intervalMatch: 3000
    }
};
