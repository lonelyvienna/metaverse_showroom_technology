"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomServer = void 0;
const RoomServer_1 = require("./RoomServer/RoomServer");
// 环境变量配置
// 程序运行的端口 默认 3001
const port = parseInt(process.env['PORT'] || '3001');
// 要连接的 MatchServer 地址（可以是内网地址）
const matchServerUrl = process.env['MATCH_SERVER_URL'] || 'http://127.0.0.1:3000';
// 客户端可访问的本服务地址
const thisServerUrl = process.env['THIS_SERVER_URL'] || ('ws://127.0.0.1:' + port);
exports.roomServer = new RoomServer_1.RoomServer({
    // 可改为通过环境变量调整配置参数
    port: port,
    matchServerUrl: matchServerUrl,
    thisServerUrl: thisServerUrl
});
// Entry function
async function main() {
    await exports.roomServer.init();
    await exports.roomServer.start();
}
main();
