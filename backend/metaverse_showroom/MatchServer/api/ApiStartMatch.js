"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStartMatch = void 0;
const matchServer_1 = require("../../matchServer");
async function ApiStartMatch(call) {
    // 加入匹配队列，待匹配
    matchServer_1.matchServer.matchQueue.add(call);
}
exports.ApiStartMatch = ApiStartMatch;
