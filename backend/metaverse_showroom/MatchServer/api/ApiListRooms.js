"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiListRooms = void 0;
const matchServer_1 = require("../../matchServer");
async function ApiListRooms(call) {
    let rooms = matchServer_1.matchServer.roomServers.reduce((prev, next) => {
        if (next.state) {
            prev = prev.concat(next.state.rooms.map(v => ({
                name: v.name,
                userNum: v.userNum,
                maxUserNum: v.maxUserNum,
                serverUrl: next.url,
                roomId: v.id,
                updateTime: v.updateTime
            })));
        }
        return prev;
    }, []);
    call.succ({
        rooms: rooms.orderByDesc(v => v.updateTime).filter(v => v.userNum > 0).slice(0, 100)
    });
}
exports.ApiListRooms = ApiListRooms;
