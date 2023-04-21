"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchServer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const tsrpc_1 = require("tsrpc");
const BackConfig_1 = require("../models/BackConfig");
const useAdminToken_1 = require("../models/flows/useAdminToken");
const serviceProto_matchServer_1 = require("../shared/protocols/serviceProto_matchServer");
const serviceProto_roomServer_1 = require("../shared/protocols/serviceProto_roomServer");
class MatchServer {
    constructor(options) {
        this.options = options;
        this.server = new tsrpc_1.HttpServer(serviceProto_matchServer_1.serviceProto, {
            port: this.options.port,
            // Remove this to use binary mode (remove from the client too)
            json: true
        });
        this.logger = this.server.logger;
        /** 已注册的 RoomServer */
        this.roomServers = [];
        this._nextRoomIndex = 1;
        // #region 匹配相关
        /** 待匹配队列 */
        this.matchQueue = new Set();
        // Flows
        (0, useAdminToken_1.useAdminToken)(this.server);
    }
    async init() {
        await this.server.autoImplementApi(path_1.default.resolve(__dirname, './api'));
    }
    async start() {
        await this.server.start();
        // 定时 log 播报房间状态
        setInterval(() => {
            this.logger.log(`
[MatchServer 状态播报]
  - 已连接 RoomServer=${this.roomServers.count(v => !!v.state)}
  - 连接中 RoomServer=${this.roomServers.count(v => !v.state)}
  - 房间总数=${this.roomServers.sum(v => { var _a, _b; return (_b = (_a = v.state) === null || _a === void 0 ? void 0 : _a.rooms.length) !== null && _b !== void 0 ? _b : 0; })}
  - 房内用户数=${this.roomServers.sum(v => { var _a, _b; return (_b = (_a = v.state) === null || _a === void 0 ? void 0 : _a.rooms.sum(v => v.userNum)) !== null && _b !== void 0 ? _b : 0; })}
`);
        }, 5000);
        // 定时执行匹配
        this.startMatch();
    }
    async joinRoomServer(serverUrl) {
        // 已经注册过
        if (this.roomServers.some(v => v.url === serverUrl)) {
            return;
        }
        // Create
        let client = new tsrpc_1.WsClient(serviceProto_roomServer_1.serviceProto, {
            server: serverUrl,
            logger: new tsrpc_1.PrefixLogger({
                logger: this.logger,
                prefixs: [chalk_1.default.bgCyan.white(`RS|${serverUrl}`)]
            }),
            heartbeat: {
                interval: 5000,
                timeout: 5000
            },
            logMsg: false
        });
        // Push
        let roomServer = {
            url: serverUrl,
            client: client
        };
        this.roomServers.push(roomServer);
        // Flows
        client.flows.postDisconnectFlow.push(v => {
            this.roomServers.remove(v1 => v1.client === client);
            return v;
        });
        client.listenMsg('admin/UpdateRoomState', msg => {
            roomServer.state = msg;
        });
        try {
            // Connect
            let op = await client.connect();
            if (!op.isSucc) {
                throw new tsrpc_1.TsrpcError(op.errMsg);
            }
            // Auth as MatchServer
            let op2 = await client.callApi('admin/Auth', {
                adminToken: BackConfig_1.BackConfig.adminToken,
                type: 'MatchServer'
            });
            if (!op2.isSucc) {
                client.disconnect();
                throw op2.err;
            }
        }
        catch (e) {
            this.roomServers.remove(v => v.url === serverUrl);
            throw e;
        }
        this.logger.log(chalk_1.default.green(`Room server joined: ${serverUrl}, roomServers.length=${this.roomServers.length}`));
    }
    async startMatch() {
        await this._doMatch().catch(e => {
            this.server.logger.error('[MatchError]', e);
        });
        setTimeout(() => { this.startMatch(); }, BackConfig_1.BackConfig.matchServer.intervalMatch);
    }
    /**
     * 执行一次匹配
     */
    async _doMatch() {
        this.logger.log(`匹配开始，匹配人数=${this.matchQueue.size}`);
        let succNum = 0;
        // 优先匹配更早开始匹配的房间
        let matchingRooms = this.roomServers.map(v => {
            var _a, _b;
            let rooms = (_b = (_a = v.state) === null || _a === void 0 ? void 0 : _a.rooms) !== null && _b !== void 0 ? _b : [];
            return rooms.map(v1 => ({
                ...v1,
                serverUrl: v.url
            }));
        }).flat().orderBy(v => v.startMatchTime).map(v => ({
            id: v.id,
            serverUrl: v.serverUrl,
            userNum: v.userNum
        }));
        for (let call of this.matchQueue) {
            // 连接已断开，不再匹配
            if (call.conn.status !== tsrpc_1.ConnectionStatus.Opened) {
                this.matchQueue.delete(call);
                return;
            }
            // 尝试匹配，你可以在此实现自己的匹配规则            
            // 这里简单起见，优先匹配人多的房间
            let room = matchingRooms.filter(v => v.userNum < BackConfig_1.BackConfig.roomServer.maxRoomUserNum).orderByDesc(v => v.userNum)[0];
            // 匹配成功
            if (room) {
                this.matchQueue.delete(call);
                ++room.userNum;
                if (room.userNum >= BackConfig_1.BackConfig.roomServer.maxRoomUserNum) {
                    matchingRooms.removeOne(v => v === room);
                }
                call.succ({
                    serverUrl: room.serverUrl,
                    roomId: room.id
                });
                ++succNum;
            }
            // 没有合适的房间，那么创建一个房间
            else {
                let retCreateRoom = await this.createRoom('系统房间 ' + (this._nextRoomIndex++));
                if (retCreateRoom.isSucc) {
                    matchingRooms.push({
                        id: retCreateRoom.res.roomId,
                        serverUrl: retCreateRoom.res.serverUrl,
                        userNum: 1
                    });
                    this.matchQueue.delete(call);
                    call.succ({
                        roomId: retCreateRoom.res.roomId,
                        serverUrl: retCreateRoom.res.serverUrl,
                    });
                }
            }
        }
        this.logger.log(`匹配结束，成功匹配人数=${succNum}`);
    }
    // #endregion
    async createRoom(roomName) {
        // 挑选一个人数最少的 RoomServer
        let roomServer = this.roomServers.filter(v => v.state).orderBy(v => v.state.connNum)[0];
        if (!roomServer) {
            return { isSucc: false, err: new tsrpc_1.TsrpcError('没有可用的房间服务器') };
        }
        // RPC -> RoomServer
        let op = await roomServer.client.callApi('admin/CreateRoom', {
            adminToken: BackConfig_1.BackConfig.adminToken,
            roomName: roomName
        });
        if (!op.isSucc) {
            return { isSucc: false, err: new tsrpc_1.TsrpcError(op.err) };
        }
        // Return
        return {
            isSucc: true,
            res: {
                roomId: op.res.roomId,
                serverUrl: roomServer.url
            }
        };
    }
}
exports.MatchServer = MatchServer;
