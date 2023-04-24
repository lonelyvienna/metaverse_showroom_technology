"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameSystem = void 0;
/**
 * 前后端复用的状态计算模块
 */
class GameSystem {
    constructor() {
        // 当前状态
        this._state = {
            players: []
        };
    }
    get state() {
        return this._state;
    }
    // 重设状态
    reset(state) {
        this._state = Object.merge({}, state);
    }
    // 应用输入，计算状态变更
    applyInput(input) {
        if (input.type === 'PlayerMove') {
            let player = this._state.players.find(v => v.userInfo.id === input.userInfo.id);
            if (!player) {
                return;
            }
            player.speedDirX = input.speed.x;
            player.speedDirY = input.speed.y;
            player.speedTime = input.dt;
            player.angle = input.angle;
            player.cameraRotateY = input.cameraRotateY;
            if (input.sport == 1) { //走
                player.type = "walk";
            }
            else if (input.sport == 2) { //跑
                player.type = "run";
            }
        }
        else if (input.type === 'PlayerJoin') {
            this.state.players.push({
                type: "walk",
                userInfo: input.userInfo,
                pos: { ...input.pos },
                speedDirX: 0,
                speedDirY: 0,
                speedTime: 0,
                cameraRotateY: 0,
                chairPosX: 0,
                chairPosZ: 0,
            });
        }
        else if (input.type === 'PlayerLeave') {
            this.state.players.remove(v => v.userInfo.id === input.userInfo.id);
        }
        else if (input.type === 'PlayerSit') {
            let player = this._state.players.find(v => v.userInfo.id === input.userInfo.id);
            if (!player) {
                return;
            }
            if (input.sport == 3) { //坐
                player.type = "sit";
                player.chairName = input.chairName;
                player.chairPosX = input.chairPos.x;
                player.chairPosZ = input.chairPos.z;
            }
            else {
                player.type = "up";
                player.chairName = input.chairName;
                player.chairPosX = 0;
                player.chairPosZ = 0;
            }
        }
        else if (input.type === 'PlayerPos') {
            let player = this._state.players.find(v => v.userInfo.id === input.userInfo.id);
            if (!player) {
                return;
            }
            player.pos.x = input.pos.x;
            player.pos.y = input.pos.y;
        }
        else if (input.type === "PlayerSelectSkin") {
            let player = this._state.players.find(v => v.userInfo.id === input.userInfo.id);
            if (!player) {
                return;
            }
            player.userInfo.skin = input.skin;
            console.log("玩家 " + player.userInfo.nickName + " 更换皮肤为: " + player.userInfo.skin);
        }
        else if (input.type === "PlayerDance") {
            let player = this._state.players.find(v => v.userInfo.id === input.userInfo.id);
            if (!player) {
                return;
            }
            player.type = "dance";
            player.danceType = input.danceType;
        }
    }
}
exports.GameSystem = GameSystem;
