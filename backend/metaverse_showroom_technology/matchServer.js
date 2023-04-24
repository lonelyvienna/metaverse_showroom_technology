"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchServer = void 0;
const MatchServer_1 = require("./MatchServer/MatchServer");
// 环境变量配置
// 程序运行的端口 默认 3000
const port = parseInt(process.env['PORT'] || '3000');
exports.matchServer = new MatchServer_1.MatchServer({
    port: port
});
// Entry function
async function main() {
    await exports.matchServer.init();
    await exports.matchServer.start();
}
main();
