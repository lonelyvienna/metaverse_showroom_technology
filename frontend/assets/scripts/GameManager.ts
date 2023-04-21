import { Scheduler } from 'cc';
import { MINIGAME } from 'cc/env';
import { BaseWsClient } from 'tsrpc-base-client';
import { WsClient as WsClientBrowser } from "tsrpc-browser";
import { WsClient as WsClientMiniapp } from "tsrpc-miniapp";
import { Facade } from '../default/mvc/core/Facade';
import { UIAPI } from '../default/mvc/util/UIUtils/UIAPI';
import PlayerModel, { RuntimeType, UserCardNameData } from './model/PlayerModel';
import { GameSystem, GameSystemState } from './shared/game/GameSystem';
import { RoomData } from './shared/game/RoomData';
import { UserInfo } from './shared/game/state/UserInfo';
import { ClientInput, MsgClientInput } from './shared/protocols/roomServer/clientMsg/MsgClientInput';
import { MsgFrame } from './shared/protocols/roomServer/serverMsg/MsgFrame';
import { serviceProto, ServiceType } from './shared/protocols/serviceProto_roomServer';

/**
 * 前端游戏状态管理
 * 主要用于实现前端的预测和和解
 */
export class GameManager {

    client: BaseWsClient<ServiceType>;

    gameSystem = new GameSystem();

    lastServerState: GameSystemState = this.gameSystem.state;
    lastRecvSetverStateTime = 0;
    selfUserInfo: UserInfo = null;
    lastSN = 0;

    get state() {
        return this.gameSystem.state;
    }

    constructor(serverUrl: string) {
        // Use browser client or miniapp client depend on the platform 
        let client = this.client = new (MINIGAME ? WsClientMiniapp : WsClientBrowser)(serviceProto, {
            // server: `ws://${location.hostname}:10501`,
            // server: `ws://120.25.74.1:10501`,
            server: serverUrl,
            json: true,
            // logger: console,
            heartbeat: {
                interval: 1000,
                timeout: 5000
            }
        });
        // client.listenMsg('server/Frame', msg => { this._onServerSync(msg) });
        client.listenMsg('serverMsg/Frame', msg => {
            this._onServerSync(msg)
        });

        // 模拟网络延迟 可通过 URL 参数 ?lag=200 设置延迟
        let networkLag = parseInt(location.search.match(/\blag=(\d+)/)?.[1] || '0');
        if (networkLag) {
            client.flows.preRecvDataFlow.push(async v => {
                await new Promise(rs => { setTimeout(rs, networkLag) })
                return v;
            });
            client.flows.preSendDataFlow.push(async v => {
                await new Promise(rs => { setTimeout(rs, networkLag) })
                return v;
            });
        }

        (window as any).gm = this;
    }

    async join(roomId: string): Promise<void> {
        if (!this.client.isConnected) {
            let resConnect = await this.client.connect();
            if (!resConnect.isSucc) {
                await new Promise(rs => { setTimeout(rs, 1) })
                return this.join(roomId);
            }
        }

        let player = Facade.getInstance().getModel(PlayerModel).getPlayer();

        if (Facade.getInstance().getModel(PlayerModel).GetGameConfig().runtime == RuntimeType.Debug) {
            player.nickname = "测试";
            player.header = "";
            let tempData = new UserCardNameData("1", "1", "1", "1", "1", "1");
            player.userCardName = tempData;
        }

        let ret = await this.client.callApi('JoinRoom', {
            roomId: roomId,
            nickname: player.nickname,
            headImg: player.header,
            openId: player.openid,
            skin: player.userCardName.skin,
        });

        if (!ret.isSucc) {

            let self = this;

            UIAPI.getInstance().showMessegeBox("提示", "加入房间失败,是否重试 ?", "取消", "确认", () => {

                return self.join(roomId);
            });

            return;
        }

        this.gameSystem.reset(ret.res.gameState);
        this.lastServerState = Object.merge(ret.res.gameState);
        this.lastRecvSetverStateTime = Date.now();
        this.selfUserInfo = ret.res.currentUser;
    }


    //发送聊天信息
    public async SendChat(msg: string) {

        const content = msg;
        let ret = await this.client.callApi('SendChat', {
            content: content
        });

        if (!ret.isSucc) {

            let self = this;

            UIAPI.getInstance().showMessegeBox("提示", "发送消息失败,是否重新发送 ?", "取消", "确认", () => {

                return self.SendChat(content);
            });
        }
    }

    private _onServerSync(frame: MsgFrame) {

        // 回滚至上一次的权威状态
        this.gameSystem.reset(this.lastServerState);

        // 计算最新的权威状态
        for (let input of frame.inputs) {
            this.gameSystem.applyInput(input);
        }
        this.lastServerState = Object.merge({}, this.gameSystem.state);
        this.lastRecvSetverStateTime = Date.now();

        // 和解 = 权威状态 + 本地输入 （最新的本地预测状态）
        let lastSn = frame.lastSn ?? -1;
        this.pendingInputMsgs.remove(v => v.sn <= lastSn);
        this.pendingInputMsgs.forEach(m => {
            m.inputs.forEach(v => {
                this.gameSystem.applyInput({
                    ...v,
                    userInfo: this.selfUserInfo
                });
            })
        })
    }

    pendingInputMsgs: MsgClientInput[] = [];
    sendClientInput(input: ClientInput, userInfo: UserInfo) {
        // 已掉线或暂未加入，忽略本地输入
        if (!this.selfUserInfo || !this.client.isConnected || userInfo.id != this.selfUserInfo.id) {
            return;
        }

        // 构造消息
        let msg: MsgClientInput = {
            sn: ++this.lastSN,
            inputs: [input]
        }

        // 向服务端发送输入
        this.pendingInputMsgs.push(msg);
        this.client.sendMsg('clientMsg/ClientInput', msg);

        // 预测状态：本地立即应用输入
        this.gameSystem.applyInput({
            ...input,
            userInfo: this.selfUserInfo
        });
    }
}

export type RoomServerConn = BaseWsClient<ServiceType> & {
    currentUserId: number;
};