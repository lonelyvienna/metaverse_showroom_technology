"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomServer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const tsrpc_1 = require("tsrpc");
const BackConfig_1 = require("../models/BackConfig");
const useAdminToken_1 = require("../models/flows/useAdminToken");
const serviceProto_matchServer_1 = require("../shared/protocols/serviceProto_matchServer");
const serviceProto_roomServer_1 = require("../shared/protocols/serviceProto_roomServer");
const useCleanConn_1 = require("./models/flows/useCleanConn");
const useSsoWs_1 = require("./models/flows/useSsoWs");
const Room_1 = require("./models/Room");
class RoomServer {
    constructor(options) {
        this.options = options;
        this.server = new tsrpc_1.WsServer(serviceProto_roomServer_1.serviceProto, {
            port: this.options.port,
            // Remove this to use binary mode (remove from the client too)
            json: true,
            logMsg: false
        });
        this.logger = this.server.logger;
        this.id2Room = new Map();
        this.rooms = [];
        this._nextRoomId = 1;
        // Flows
        (0, useAdminToken_1.useAdminToken)(this.server);
        (0, useSsoWs_1.useSsoWs)(this.server);
        (0, useCleanConn_1.useCleanConn)(this.server);
        // 定时清除闲置的房间
        setInterval(() => {
            this._clearIdleRooms();
        }, 10000);
    }
    async init() {
        await this.server.autoImplementApi(path_1.default.resolve(__dirname, './api'));
    }
    async start() {
        await this.server.start();
        // 启动成功后，定时检测加入匹配服务
        setInterval(() => { this.joinMatchServer(); }, 5000);
        this.joinMatchServer();
    }
    /**
     * 注册到 MatchServer
     */
    async joinMatchServer() {
        // 防止重复连接
        if (this.matchServerConn || this._isJoiningMatchServer) {
            return;
        }
        this.logger.log(chalk_1.default.cyan('正在加入 MatchServer: ' + this.options.matchServerUrl));
        let client = new tsrpc_1.HttpClient(serviceProto_matchServer_1.serviceProto, {
            server: this.options.matchServerUrl
        });
        let ret = await client.callApi('admin/RoomServerJoin', {
            adminToken: BackConfig_1.BackConfig.adminToken,
            serverUrl: this.options.thisServerUrl
        });
        if (!ret.isSucc) {
            this.logger.error('MatchServer 加入失败', ret.err);
            return;
        }
        if (!this.matchServerConn) {
            this.logger.error('MatchServer 加入成功, 但缺少 matchServerConn');
            return;
        }
        this.logger.log(chalk_1.default.green('MatchServer 加入成功'));
    }
    createRoom(roomName) {
        let room = new Room_1.Room({
            id: '' + this._nextRoomId++,
            maxUser: 30,
            name: roomName,
            users: [],
            messages: [],
            startMatchTime: Date.now(),
            updateTime: Date.now()
        });
        this.rooms.push(room);
        this.id2Room.set(room.data.id, room);
        return room;
    }
    _clearIdleRooms() {
        const now = Date.now();
        // 清除超过 5 秒没有玩家的房间
        this.rooms.filter(v => v.data.lastEmptyTime && now - v.data.lastEmptyTime >= 10000).forEach(room => {
            room.destroy();
        });
    }
}
exports.RoomServer = RoomServer;
