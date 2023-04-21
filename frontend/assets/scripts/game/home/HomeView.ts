/*
 * @Author: guofuyan
 * @Date: 2022-06-16 01:02:47
 * @LastEditTime: 2023-02-23 23:49:25
 * @LastEditors: guofuyan
 * @Description:
 */
import { assetManager, Button, Camera, Color, director, EditBox, EventTouch, ImageAsset, Input, input, instantiate, Label, log, Material, Node, PageView, ParticleSystem2D, Prefab, screen, ScrollView, Size, Sprite, SpriteFrame, Texture2D, Toggle, tween, UIOpacity, UITransform, Vec2, Vec3, _decorator } from "cc";
import { BaseView } from "../../../default/mvc/core/base/BaseView";
import { Facade } from "../../../default/mvc/core/Facade";
import AudioUtil from "../../../default/mvc/util/AudioUtil";
import { SpriteToTexture } from "../../../default/mvc/util/SpriteToTexture";
import { UIAPI } from "../../../default/mvc/util/UIUtils/UIAPI";
import EventMgr from "../../../default/standar/event/EventMgr";
import UIEffectHelper from "../../../default/standar/UIEffectHelper";
import { AKPlayerController } from "../../akplayer/AKPlayerController";
import DrawHelper from "../../DrawHelper";
import DrawingBoard from "../../DrawingBoard";
import DrawingBoardExt from "../../DrawingBoardExt";
import { GameManager } from "../../GameManager";
import PlayerModel, { Player, PlayerStateType, UserCardNameData } from "../../model/PlayerModel";
import { gameConfig } from "../../shared/game/gameConfig";
import { UserInfo } from "../../shared/game/state/UserInfo";
import { ResStartMatch } from "../../shared/protocols/matchServer/PtlStartMatch";
import { Chair } from "../player/Chair";
import OrbitCamera from "../player/OrbitCamera";
import { PlayerCtl } from "../player/PlayerCtl";
import { PlayerName } from "../player/PlayerName";
const { ccclass, property } = _decorator;

@ccclass
export default class HomeView extends BaseView {

    public static readonly Enter = "Enter";

    public static readonly EventChangeAnimationState = "ChangeAnimationState";

    public static readonly openPerson = "openPerson";

    public static readonly openEditPerson = "openEditPerson";

    public static readonly editUserInfo = "editUserInfo";

    public static readonly nameCardList = "nameCardList";

    public static readonly getOtherNameCard = "getOtherNameCard";

    public static readonly exchangeNameCard = "exchangeNameCard";

    public static readonly danceClick = "danceClick";

    @property(Button)
    public dance: Button = null;

    @property(Button)
    public sitUp: Button = null;   //坐起

    @property(Node)
    public joystick: Node = null;   //遥感

    @property(Node)
    public capture!: Node;   //截图内容

    @property(EditBox)
    public inputChat!: EditBox;  //输入框

    @property(Node)
    public chatMsgs!: Node;   //消息父节点

    @property(Prefab)
    public chatItem!: Prefab;   //消息预制体

    @property(Label)
    public nameText!: Label;   //昵称

    @property(Sprite)
    public headImg!: Sprite;   //头像

    @property(Node)
    public nameCardPage!: Node;   //名片夹

    @property(EditBox)
    public nameCardEditBox!: EditBox;   //名片夹输入框

    @property(ScrollView)
    public nameCardScrollView!: ScrollView;   //名片夹scrollview

    @property(Node)
    public nameCardContent!: Node;   //名片夹item父节点

    @property(Node)
    public invitePage!: Node;   //邀请

    @property(Node)
    public sendMessage!: Node;   //发送信息按钮

    @property(Node)
    public message!: Node;   //消息输入框

    @property(Node)
    public popuNameCardParent!: Node;   //弹出名片父节点

    @property(Node)
    public playerList!: Node;   //用户列表框

    @property(Node)
    public playerListContent!: Node;   //用户列表父节点

    @property(Node)
    public personInfo!: Node;   //个人中心

    @property(Node)
    public personEditBox!: Node;   //个人中心编辑框

    @property(Node)
    public titlePopu!: Node;   //提示框

    @property(Node)
    public changePlayer!: Node;   //更换形象

    @property(Node)
    public imagePage!: Node;   //图片页

    @property(Node)
    public pageView!: Node;   //分页

    @property(Node)
    public videoPage!: Node;   //视频

    @property({ type: AKPlayerController })
    public akCtl: AKPlayerController = null;

    @property({ type: AKPlayerController })
    public mapAkCtl: AKPlayerController = null;

    @property({ type: AKPlayerController })
    public moveSceenAkCtl: AKPlayerController = null;

    @property(Node)
    players!: Node;  //玩家父节点

    @property(Prefab)
    prefabPlayer1!: Prefab; //玩家1号预制体

    @property(Prefab)
    prefabPlayer2!: Prefab; //玩家2号预制体

    @property(Prefab)
    prefabPlayerName!: Prefab; //名字预制体

    @property(Prefab)
    prefabNameCardItem!: Prefab; //名片夹列表item预制体

    @property(Prefab)
    prefabPlayerItem!: Prefab; //玩家列表item预制体

    @property(Prefab)
    public prefabPopuNameCard!: Prefab;   //弹出名片夹预制体

    @property(Node)
    playerNames!: Node;   //名字

    @property(OrbitCamera)
    camera: OrbitCamera = null as any; //相机

    // @property(OrbitCamera)
    // rtCamera: OrbitCamera = null as any;  //截图相机

    @property(Node)
    chairs!: Node;  //椅子父节点

    @property(ParticleSystem2D)
    fireworks!: ParticleSystem2D;  //烟花

    public gameManager!: GameManager;
    private _playerInstances: { [playerId: string]: PlayerCtl | undefined } = {};
    private _selfSpeed?: Vec2 = new Vec2(0, 0);
    private _angle: number = 0;
    private _nearByPlayer: UserInfo[] = [];
    private danceType: number = 0;

    private offlineTitle: boolean = false;

    public init(data?: any): void {
    }

    initView(data: ResStartMatch) {

        EventMgr.getInstance().registerListener("ChatMsg", this, this.pushChatMsg);       //消息

        EventMgr.getInstance().registerListener("joysitckPlayer", this, this.joysitckHandle);       //监听摇杆数据

        EventMgr.getInstance().registerListener("PlayerSit", this, this.playerSitDownOrUp);       //监听玩家坐下站起

        EventMgr.getInstance().registerListener("PlayerSkin", this, this.playerSkin);       //监听换肤

        EventMgr.getInstance().registerListener("OpenImage", this, this.openImagePage);       //监听打开图片页

        EventMgr.getInstance().registerListener("OpenPage", this, this.openPageView);       //监听打开图片页

        EventMgr.getInstance().registerListener("OpenIntroduce", this, this.openIntroduce);       //监听打开简介

        EventMgr.getInstance().registerListener("OpenVideo", this, this.openVideoPage);       //监听打开视频

        EventMgr.getInstance().registerListener("CloseVideo", this, this.onCloseVideoPageClick);       //监听关闭视频

        EventMgr.getInstance().registerListener("playMapLive", this, this.onPlayMapLive);       //监听关闭视频

        EventMgr.getInstance().registerListener("playShowroom", this, this.onPlayShowroom);       //监听关闭视频

        // input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);

        (window as any).game = this;

        this.gameManager = new GameManager(data.serverUrl);

        this.mapAkCtl = this.node.parent.parent.getChildByName("Map").getComponent(AKPlayerController);

        this.akCtl = this.node.parent.parent.getChildByName("VideoPage").getComponent(AKPlayerController);

        this.moveSceenAkCtl = this.node.parent.parent.getChildByName("MoveScreen").getChildByName("Screen").getComponent(AKPlayerController);

        this.players = this.node.parent.parent.getChildByName("PlayerParent");

        this.camera = this.node.parent.parent.getChildByName("Main Camera").getComponent(OrbitCamera);

        this.videoPage = this.node.parent.parent.getChildByName("VideoPage");

        this.chairs = this.node.parent.parent.getChildByName("chair");

        this.gameManager.client.listenMsg('serverMsg/Chat', v => {

            let playerName = this.playerNames.getChildByName(v.user.id.toString())?.getComponent(PlayerName);

            if (playerName) {

                playerName.showChatMsg(v.content);
            }

            EventMgr.getInstance().sendListener("ChatMsg", { "msg": v.user.nickName + "：" + v.content });
        });

        this.gameManager.client.listenMsg('serverMsg/UserJoin', v => {

            EventMgr.getInstance().sendListener("ChatMsg", { "msg": "欢迎 " + v.user.nickName + " 进入展厅" });
        });

        // this.EnterGameScene(data.roomId); //进入游戏

        this.playMapLive();

        this.playMoveScreenLive();
    }

    onClose() {
    }

    onPlayShowroom(self, params) {

        self.playMoveScreenLive();
    }

    onPlayMapLive(self, params) {

        self.playMapLive();
    }

    /**
     * 播放投影视频
     */
    playMapLive() {

        let liveString = "https://wanlian2022.oss-cn-hangzhou.aliyuncs.com/metaverse/Flv/showRoomMapNoSound.flv";

        this.mapAkCtl.updatePlayerInfo(liveString, false);

        this.mapAkCtl.play(liveString, false);
    }

    /**
     * 播放移动屏幕视频
     */
    playMoveScreenLive() {

        let liveString = "https://wanlian2022.oss-cn-hangzhou.aliyuncs.com/metaverse/Flv/showroom.flv";

        this.moveSceenAkCtl.updatePlayerInfo(liveString, false);

        this.moveSceenAkCtl.play(liveString, false);

        this.moveSceenAkCtl.hasAudio(false);
    }

    /**
     * 摇杆数据处理
     * @param self
     * @param params object
     */
    private joysitckHandle(self, params) {

        if (params.x == 0 || params.y == 0) {

            self._selfSpeed = undefined;

            self._angle == 0;

        } else {

            if (!self._selfSpeed) {

                self._selfSpeed = new Vec2;
            }

            self._selfSpeed.set(params.pos.x, params.pos.y);

            self._angle = params.angle;
        }
    }

    /**
     * 坐下站起处理
     * @param self
     * @param params object
     */
    private playerSitDownOrUp(self, params) {

        if (params.state == "sitDown") {  //坐下

            self.dance.node.active = false;

            self.sitUp.node.active = true;

            self.joystick.active = false;

        } else if (params.state == "sitUp") {  //站起

            self.dance.node.active = true;

            self.sitUp.node.active = false;

            self.joystick.active = true;
        }
    }


    /**
     * 换肤
     * @param self 
     * @param params 
     */
    private playerSkin(self, params) {

        for (let i = self.players.children.length - 1; i > -1; --i) {

            let player = self.players.children[i].getComponent(PlayerCtl)!;

            if (player.playerId == params.userInfo.id) {

                let playerName = null;

                if (self.playerNames.children.length > 0) {

                    playerName = self.playerNames.getChildByName(player.playerId.toString());
                }

                player.node.removeFromParent();

                if (playerName) {

                    playerName.removeFromParent();
                }

                delete self._playerInstances[player.playerId];

                break;
            }
        }
    }

    update(dt: number) {
        //this.gameManager.localTimePast();

        if (!this.gameManager.client.isConnected && this.gameManager.selfUserInfo != null && !this.offlineTitle) {

            this.onOpenTitlePopu("提示", "服务器断开连接!");

            this.offlineTitle = true;

            return;
        }

        if (this._selfSpeed && this._selfSpeed.lengthSqr()) {

            let player = Facade.getInstance().getModel(PlayerModel).getPlayer();

            if (player.sportMode == PlayerStateType.sit) return;

            this._selfSpeed.normalize().multiplyScalar(200);

            this.gameManager.sendClientInput({
                type: 'PlayerMove',
                sport: player.sportMode,
                speed: {
                    x: this._selfSpeed.x,
                    y: this._selfSpeed.y
                },
                angle: this._angle,
                cameraRotateY: this.camera!.node.eulerAngles.y,
                dt: dt
            }, this.gameManager.selfUserInfo);

        } else {

            this.gameManager.sendClientInput({
                type: 'PlayerMove',
                sport: PlayerStateType.idle,
                speed: {
                    x: 0,
                    y: 0
                },
                angle: 0,
                cameraRotateY: this.camera!.node.eulerAngles.y,
                dt: dt
            }, this.gameManager.selfUserInfo);
        }

        this._updatePlayers();

        this._updateChairs();

        this._updatePlayerList();
    }

    /**
     * 更新玩家状态
     */
    private _updatePlayers() {
        // Update pos
        let playerStates = this.gameManager.state.players;

        for (let playerState of playerStates) {

            let player = this._playerInstances[playerState.userInfo.id];

            // 场景上还没有这个 Player，新建之
            if (!player) {

                let node;

                switch (playerState.userInfo.skin) {

                    case "1":

                        node = instantiate(this.prefabPlayer1);

                        break;

                    case "2":

                        node = instantiate(this.prefabPlayer2);

                        break;

                    default:

                        node = instantiate(this.prefabPlayer1);

                        break;
                }

                this.players.addChild(node);

                player = this._playerInstances[playerState.userInfo.id] = node.getComponent(PlayerCtl)!;

                player.init(playerState, playerState.userInfo.id === this.gameManager.selfUserInfo.id)

                let nodeName = instantiate(this.prefabPlayerName);

                nodeName.name = playerState.userInfo.id.toString();

                this.playerNames.addChild(nodeName);

                nodeName.getComponent(PlayerName)!.options = {

                    namePosNode: player.node_head!,

                    camera3D: this.camera.getComponent(Camera)!,

                    nickname: playerState.userInfo.nickName || '未知用户'
                };

                // 摄像机拍摄自己
                if (playerState.userInfo.id === this.gameManager.selfUserInfo.id) {

                    this.camera.target = node.getComponent(PlayerCtl).node_head;
                    // this.rtCamera.target = node.getComponent(PlayerCtl).node_head;
                }
            }

            // 根据最新状态，更新 Player 表现组件
            player.updateState(playerState);
        }

        // Clear left players
        for (let i = this.players.children.length - 1; i > -1; --i) {

            let player = this.players.children[i].getComponent(PlayerCtl)!;

            let playerName = null;

            if (this.playerNames.children.length > 0) {

                playerName = this.playerNames.getChildByName(player.playerId.toString());
            }

            if (!this.gameManager.state.players.find(v => v.userInfo.id === player.playerId)) {

                EventMgr.getInstance().sendListener("ChatMsg", { "msg": player.state.userInfo.nickName + " 离开展厅" });

                player.node.removeFromParent();

                if (playerName) {

                    playerName.removeFromParent();
                }

                delete this._playerInstances[player.playerId];
            }
        }
    }

    /**
     * 更新椅子状态
     */
    private _updateChairs() {

        for (let i = 0; i < this.chairs.children.length; i++) {

            let chair = this.chairs.children[i].getComponent(Chair)!;

            chair.UpdateState(this.players);
        }
    }

    /**
     * 更新用户列表
     */
    private _updatePlayerList() {

        let playerStates = this.gameManager.state.players;

        let playerInfoArr: UserInfo[] = [];

        for (let i = 0; i < playerStates.length; i++) {

            //自己
            if (playerStates[i].userInfo.id === this.gameManager.selfUserInfo.id) {

                for (let j = 0; j < playerStates.length; j++) {

                    if (playerStates[j].userInfo.id === this.gameManager.selfUserInfo.id) {

                        playerInfoArr.push(playerStates[j].userInfo);

                        continue;
                    }

                    let selfPos = new Vec3(playerStates[i].pos.x, 0, playerStates[i].pos.y);

                    let otherPos = new Vec3(playerStates[j].pos.x, 0, playerStates[j].pos.y);

                    let disX = selfPos.x - otherPos.x;

                    let disY = selfPos.y - otherPos.y;

                    let disZ = selfPos.z - otherPos.z;

                    let distance: number = Math.sqrt(disX * disX + disY * disY + disZ * disZ);

                    // console.log("distance: " + distance);

                    if (distance <= 2) {  //在自己范围之内

                        playerInfoArr.push(playerStates[j].userInfo);
                    }
                }
            }
        }

        if (playerInfoArr.length <= 1) {  //只有自己,关闭用户列表,显示输入框

            this.message.getChildByName("HavePlayer").getChildByName("BtnSwitch").active = false;

            if (this.playerList.active) {

                this.onSwitchEditBox();
            }

            this._nearByPlayer = [];

        } else {

            if (this.message.active == true && this.inputChat.string != "") {

                return;
            }

            if (this._nearByPlayer.length == playerInfoArr.length) {  //跟之前一样，不用重新绑定

                for (let i = 0; i < this._nearByPlayer.length; i++) {

                    if (this._nearByPlayer[i].id != playerInfoArr[i].id) {

                        this.bindPlayerListInfo(playerInfoArr);

                        this._nearByPlayer = playerInfoArr;

                        break;

                    } else {

                        continue;
                    }
                }
            } else {

                if (this._nearByPlayer.length == 0) {  //之前没人,关闭输入框,打开用户列表,绑定用户(最多4个,其中最左边为自己)

                    this.onSwitchPlayerInfo();

                    this.bindPlayerListInfo(playerInfoArr);

                    this._nearByPlayer = playerInfoArr;
                }
            }
        }
    }

    /**
     * 绑定底部用户信息(最多4个,其中最左边为自己)
     * @param data 
     */
    bindPlayerListInfo(data: UserInfo[]) {

        if (data.length <= 1) return;

        this.message.getChildByName("HavePlayer").getChildByName("BtnSwitch").active = true;

        this.playerListContent.removeAllChildren();

        let tempUserInfo: UserInfo[] = [];

        //先添加自己
        for (let i = 0; i < data.length; i++) {

            if (data[i].id == this.gameManager.selfUserInfo.id) {

                tempUserInfo.push(data[i]);

                break;
            }
        }

        //再添加其他人
        for (let i = 0; i < data.length; i++) {

            if (data[i].id != this.gameManager.selfUserInfo.id) {

                if (tempUserInfo.length < 4) {

                    tempUserInfo.push(data[i]);
                }
            }
        }

        //绑定
        for (let i = 0; i < tempUserInfo.length; i++) {

            let player = instantiate(this.prefabPlayerItem);

            let name = tempUserInfo[i].nickName;

            if (name.length > 4) {

                name = name.slice(0, 4) + "...";
            }

            player.getChildByName("NameText").getComponent(Label).string = name;

            player.getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 0;

            assetManager.loadRemote<ImageAsset>(tempUserInfo[i].headImg + '?aa=aa.jpg', function (err, imageAsset) {

                if (!err && player) {

                    const spriteFrame = new SpriteFrame();

                    const texture = new Texture2D();

                    texture.image = imageAsset;

                    spriteFrame.texture = texture;

                    player.getChildByName("MaskHeadImg").getChildByName("HeadImg").getComponent(Sprite).spriteFrame = spriteFrame;

                    player.getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 255;
                }
            });

            player.on("click", () => {

                //点击查看名片信息
                this.sendEvent(HomeView.getOtherNameCard, tempUserInfo[i].openId);

            }, this);

            this.playerListContent.addChild(player);
        }
    }

    /**
     * 绑定点击底部玩家弹出的名片夹信息
     * @param data 
     */
    bindPopuNameCardInfo(data: UserCardNameData) {

        let self = this;

        this.popuNameCardParent.removeAllChildren();

        let name = data.nickname;

        if (name.length > 4) {

            name = name.slice(0, 4) + "...";
        }

        let work = data.work;

        if (work.length > 5) {

            work = work.slice(0, 5) + "...";

        } else if (work == "") {

            work = "暂无职位";
        }

        let company = data.company;

        if (company.length > 17) {

            company = company.slice(0, 17) + "...";

        } else if (company == "") {

            company = "暂未设置公司信息";
        }

        let popuNameCard = instantiate(this.prefabPopuNameCard);

        popuNameCard.getChildByName("Info").getChildByName("Layout").getChildByName("Name").getComponent(Label).string = name;

        popuNameCard.getChildByName("Info").getChildByName("Layout").getChildByName("Work").getComponent(Label).string = work;

        popuNameCard.getChildByName("Info").getChildByName("Company").getComponent(Label).string = company;

        if (data.id == this.gameManager.selfUserInfo.openId) {  //查看的是自己,不显示按钮

            popuNameCard.getChildByName("BtnExchanged").active = false;

            popuNameCard.getChildByName("BtnExchange").active = false;

        } else {

            if (data.isExchange == 0) {

                popuNameCard.getChildByName("BtnExchanged").active = false;

                popuNameCard.getChildByName("BtnExchange").active = true;

                popuNameCard.getChildByName("BtnExchange").on("click", () => {

                    //交换名片
                    this.sendEvent(HomeView.exchangeNameCard, data.id);

                }, this);

            } else if (data.isExchange == 1) {

                popuNameCard.getChildByName("BtnExchanged").active = true;

                popuNameCard.getChildByName("BtnExchange").active = false;
            }
        }

        popuNameCard.getChildByName("Info").getChildByName("BtnClose").on("click", () => {

            this.popuNameCardParent.removeAllChildren();

        }, this);

        popuNameCard.getChildByName("Info").getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 0;

        assetManager.loadRemote<ImageAsset>(data.header + '?aa=aa.jpg', function (err, imageAsset) {

            if (!err && popuNameCard) {

                const spriteFrame = new SpriteFrame();

                const texture = new Texture2D();

                texture.image = imageAsset;

                spriteFrame.texture = texture;

                popuNameCard.getChildByName("Info").getChildByName("MaskHeadImg").getChildByName("HeadImg").getComponent(Sprite).spriteFrame = spriteFrame;

                popuNameCard.getChildByName("Info").getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 255;
            }
        });

        this.popuNameCardParent.addChild(popuNameCard);

        popuNameCard.setPosition(new Vec3(0, -340, 0));
    }

    /**
     * 隐藏交换按钮
     */
    hideExchangeBtn() {

        this.popuNameCardParent.getChildByName("PopuNameCard").getChildByName("BtnExchanged").active = true;

        this.popuNameCardParent.getChildByName("PopuNameCard").getChildByName("BtnExchange").active = false;
    }

    /**
     * 进入游戏
     */
    EnterGameScene(roomId: string) {

        // 断线 3 秒后自动重连
        // this.gameManager.client.flows.postDisconnectFlow.push(v => {
        //     setTimeout(() => {
        //         this.gameManager.join(roomId);
        //     }, 3000)
        //     return v;
        // });

        //进入游戏
        this.gameManager.join(roomId);
    }

    OnClick() {

        var self = this;

        AudioUtil.playEffect("audioclip/effect");       //播放音效

        UIEffectHelper.fade(this.node, false, function () {

            //AudioUtil.removeEffectFromPool("audioclip/effect");       //移除音效

            self.sendEvent(HomeView.Enter, "");     //跳转到下一个页面
        });
    }

    /**
     * 改变玩家动画的状态，走或者跑
     */
    onChangeAnimationState() {

        this.sendEvent(HomeView.EventChangeAnimationState, "");

        AudioUtil.playEffect("audio/Click");       //播放音效
    }

    /**
     * 发送聊天信息
     * @returns 
     */
    async onBtnSendChat() {

        if (!this.inputChat.string) {

            this.onOpenTitlePopu("提示", "请输入聊天内容!");

            return;
        }

        this.gameManager.SendChat(this.inputChat.string);

        this.inputChat.string = '';

        this.onCloseSend();
    }

    /**
     * 消息
     * @param richText 
     */
    private pushChatMsg(self, params: any) {

        let node = instantiate(self.chatItem);

        self.chatMsgs.addChild(node);

        node.setPosition(new Vec3(0, 0, 0));

        let string = self.stringSlice(params.msg);

        node.getChildByName("Label").getComponent(Label)!.string = string;

        // 最多保留 6 条记录
        while (self.chatMsgs.children.length > 6) {

            self.chatMsgs.children[0].removeFromParent();
        }

        self.scheduleOnce(() => { node.removeFromParent(); node.destroy(); }, 10);
    }

    /**
     * 字符串截取
     * @param string 
     */
    stringSlice(string: string) {

        let result: string = "";

        let num = Math.floor(string.length / 16);

        if (num > 0) {    //长度超过16换行

            let stringArr: string[] = [];

            for (let i = 0; i <= num; i++) {

                let temp = "";

                if (i == num) {

                    temp = string.slice(i * 16, string.length);

                } else {

                    temp = string.slice(i * 16, (i + 1) * 16 - 1);
                }

                stringArr.push(temp);
            }

            for (let i = 0; i < stringArr.length; i++) {

                if (this.checksum(stringArr[i]) >= 8 && i != stringArr.length - 1) {

                    stringArr[i] += "\n";
                }

                result += stringArr[i];
            }

        } else {

            result = string;
        }

        return result;
    }

    /**
     * 点击跳
     */
    onJumpButtonClick(event: EventTouch, customEventData: string) {

        event.target.active = false;

        EventMgr.getInstance().sendListener("InputJump", { "currentSportMode": "walk" });      //跳跃动作，并附带一个目前的运动模式
    }

    /**
     * 打开海报
     */
    onOpenCapture(event: EventTouch, customEventData: string) {

        if (customEventData == "RTInvite") {

            this.capture.getChildByName("RTInvite").active = true;

        } else if (customEventData == "RTIntroduce") {

            this.capture.getChildByName("RTIntroduce").active = true;

        } else if (customEventData == "RTSchedule") {

            this.capture.getChildByName("RTSchedule").active = true;
        }

        this.invitePage.active = true;

        let com = this.capture.getChildByName("SpriteToTexture").getComponent(SpriteToTexture);

        this.scheduleOnce(() => { com.copyRenderTex(); }, 0.1);
    }

    /**
     * 关闭海报
     */
    onCloseCapture() {

        this.invitePage.active = false;

        this.capture.getChildByName("RTInvite").active = false;

        this.capture.getChildByName("RTIntroduce").active = false;

        this.capture.getChildByName("RTSchedule").active = false;
    }

    /**
     * 打开名片夹
     */
    onOpenNameCard() {

        this.nameCardEditBox.string = "";

        this.sendEvent(HomeView.nameCardList, this.nameCardEditBox.string);

        this.nameCardPage.getComponent(UIOpacity).opacity = 0;

        let bgNode = this.nameCardPage.getChildByName("Bg");

        bgNode.setPosition(new Vec3(bgNode.position.x, -1400, bgNode.position.z));

        this.nameCardPage.active = true;

        tween(bgNode)

            .to(0.5, { position: new Vec3(bgNode.position.x, -174, bgNode.position.z) }, { easing: "expoOut" })

            .start();

        tween(this.nameCardPage.getComponent(UIOpacity))

            .to(0.5, { opacity: 255 }, { easing: "expoOut" })

            .start();
    }

    /**
     * 搜索名片
     */
    onSearchNameCard() {

        this.sendEvent(HomeView.nameCardList, this.nameCardEditBox.string);
    }

    /**
     * 绑定名片夹信息
     * @param data 
     */
    bindNameCardInfo(data: UserCardNameData[]) {

        this.nameCardContent.removeAllChildren();

        this.nameCardScrollView.node.parent.getChildByName("NoNameCard").active = false;

        if (data.length == 0) {

            this.nameCardScrollView.node.parent.getChildByName("NoNameCard").active = true;

            return;
        }

        for (let i = 0; i < data.length; i++) {

            let cardName = instantiate(this.prefabNameCardItem);

            cardName.getChildByName("Name").getComponent(Label).string = data[i].nickname;

            let work = data[i].work;

            if (work.length > 5) {

                work = work.slice(0, 5) + "...";

            } else if (work == "") {

                work = "暂无职位";
            }

            let company = data[i].company;

            if (company.length > 14) {

                company = company.slice(0, 14) + "...";

            } else if (company == "") {

                company = "暂未设置公司信息";
            }

            cardName.getChildByName("Layout").getChildByName("Work").getComponent(Label).string = work;

            cardName.getChildByName("Layout").getChildByName("Company").getComponent(Label).string = company;

            cardName.getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 0;

            assetManager.loadRemote<ImageAsset>(data[i].header + '?aa=aa.jpg', function (err, imageAsset) {

                if (!err && cardName) {

                    const spriteFrame = new SpriteFrame();

                    const texture = new Texture2D();

                    texture.image = imageAsset;

                    spriteFrame.texture = texture;

                    cardName.getChildByName("MaskHeadImg").getChildByName("HeadImg").getComponent(Sprite).spriteFrame = spriteFrame;

                    cardName.getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 255;
                }
            });

            this.nameCardContent.addChild(cardName);
        }
    }

    /**
     * 关闭名片夹
     */
    onCloseNameCard() {

        let self = this;

        let bgNode = this.nameCardPage.getChildByName("Bg");

        tween(bgNode)

            .to(0.5, { position: new Vec3(bgNode.position.x, -1400, bgNode.position.z) }, { easing: "expoOut" })

            .call(() => { self.nameCardPage.active = false; })

            .start();


        tween(this.nameCardPage.getComponent(UIOpacity))

            .to(0.5, { opacity: 0 }, { easing: "expoOut" })

            .start();
    }

    /**
     * 显示发送按钮
     */
    onOpenSend() {

        this.sendMessage.active = true;

        this.sendMessage.parent.getChildByName("HavePlayer").active = false;
    }

    /**
     * 关闭发送按钮
     */
    onCloseSend() {

        if (this.inputChat.string == "") {

            this.sendMessage.active = false;

            this.sendMessage.parent.getChildByName("HavePlayer").active = true;
        }
    }

    /**
     * 切换到输入框
     */
    onSwitchEditBox() {

        this.message.active = true;

        this.inputChat.string = "";

        this.playerList.active = false;
    }

    /**
     * 切换到用户列表
     */
    onSwitchPlayerInfo() {

        this.message.active = false;

        this.playerList.active = true;
    }

    /**
     * 打开个人中心
     */
    onOpenPersonClick() {

        this.sendEvent(HomeView.openPerson);
    }

    /**
     * 关闭个人中心
     */
    onClosePersonClick() {

        let self = this;

        let bgNode = this.personInfo.getChildByName("Bg");

        tween(bgNode)

            .to(0.5, { position: new Vec3(bgNode.position.x, -1100, bgNode.position.z) }, { easing: "expoOut" })

            .call(() => { self.personInfo.active = false; })

            .start();


        tween(this.personInfo.getComponent(UIOpacity))

            .to(0.5, { opacity: 0 }, { easing: "expoOut" })

            .start();
    }

    /**
     * 打开个人中心
     */
    OpenPerson(player: Player, isAni: boolean = true) {

        let self = this;

        this.gameManager.selfUserInfo.skin = player.userCardName.skin;

        let work = player.userCardName.work;

        let workColor = new Color(255, 255, 255);

        let company = player.userCardName.company;

        let companyColor = new Color(255, 255, 255);

        if (work == "") {

            work = "我的职位";

            workColor = new Color(142, 142, 142);
        }

        if (company == "") {

            company = "我的公司";

            companyColor = new Color(142, 142, 142);
        }

        this.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("Name").getComponent(Label).string = player.nickname;

        this.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("Work").getChildByName("Work").getComponent(Label).string = work;

        this.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("Work").getChildByName("Work").getComponent(Label).color = workColor;

        this.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("Company").getChildByName("Company").getComponent(Label).string = company;

        this.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("Company").getChildByName("Company").getComponent(Label).color = companyColor;

        if (!isAni) return;

        self.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 0;

        assetManager.loadRemote<ImageAsset>(player.header + '?aa=aa.jpg', function (err, imageAsset) {

            if (!err && self.personInfo) {

                const spriteFrame = new SpriteFrame();

                const texture = new Texture2D();

                texture.image = imageAsset;

                spriteFrame.texture = texture;

                self.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("MaskHeadImg").getChildByName("HeadImg").getComponent(Sprite).spriteFrame = spriteFrame;

                self.personInfo.getChildByName("Bg").getChildByName("Info").getChildByName("MaskHeadImg").getComponent(UIOpacity).opacity = 255;
            }
        });

        this.personInfo.getComponent(UIOpacity).opacity = 0;

        let bgNode = this.personInfo.getChildByName("Bg");

        bgNode.setPosition(new Vec3(bgNode.position.x, -1100, bgNode.position.z));

        this.personInfo.active = true;

        tween(bgNode)

            .to(0.5, { position: new Vec3(bgNode.position.x, -424, bgNode.position.z) }, { easing: "expoOut" })

            .start();

        tween(this.personInfo.getComponent(UIOpacity))

            .to(0.5, { opacity: 255 }, { easing: "expoOut" })

            .start();
    }

    /**
     * 打开更换形象
     */
    OpenSelectRole() {

        let name = "Toggle" + this.gameManager.selfUserInfo.skin;

        this.changePlayer.getComponent(UIOpacity).opacity = 0;

        let bgNode = this.changePlayer.getChildByName("Bg");

        bgNode.setPosition(new Vec3(900, bgNode.position.y, bgNode.position.z));

        this.changePlayer.active = true;

        this.changePlayer.getChildByName("Bg").getChildByName("ToggleGroup").getChildByName(name).getComponent(Toggle).isChecked = true;

        tween(bgNode)

            .to(0.5, { position: new Vec3(0, bgNode.position.y, bgNode.position.z) }, { easing: "expoOut" })

            .start();

        tween(this.changePlayer.getComponent(UIOpacity))

            .to(0.5, { opacity: 255 }, { easing: "expoOut" })

            .start();
    }

    /**
     * 关闭更换形象
     */
    onCloseSelectRole() {

        let self = this;

        let bgNode = this.changePlayer.getChildByName("Bg");

        tween(bgNode)

            .to(0.5, { position: new Vec3(-900, bgNode.position.y, bgNode.position.z) }, { easing: "expoOut" })

            .call(() => { self.changePlayer.active = false; })

            .start();


        tween(this.changePlayer.getComponent(UIOpacity))

            .to(0.5, { opacity: 0 }, { easing: "expoOut" })

            .start();
    }


    /**
     * 选择角色
     * @param event 
     * @param customEventData 
     */
    toggleSelectRole(event: EventTouch, customEventData: string) {

        if (event.target.getComponent(Toggle).isChecked) return;

        console.log(customEventData);

        this.sendEvent(HomeView.editUserInfo, { work: "", company: "", roleType: customEventData });

        this.gameManager.sendClientInput({

            type: 'PlayerSelectSkin',

            skin: customEventData,

        }, this.gameManager.selfUserInfo);
    }

    /**
     * 点击编辑
     */
    onEditBoxClick(event, customEventData: string) {

        if (customEventData == "Work") {

            this.sendEvent(HomeView.openEditPerson, { title: "我的职位名称", type: customEventData });

        } else if (customEventData == "Company") {

            this.sendEvent(HomeView.openEditPerson, { title: "我的公司名称", type: customEventData });
        }
    }

    /**
     * 打开编辑框
     * @param title 标题
     * @param type 类型
     */
    onOpenPersonEditBox(title: string, type: string, contetn: UserCardNameData) {

        this.personEditBox.getChildByName("Bg").getChildByName("Title").getComponent(Label).string = title;

        this.personEditBox.getChildByName("Bg").getChildByName("EditBox").getComponent(EditBox).string = "";

        this.personEditBox.active = true;

        if (type == "Work") {

            this.personEditBox.getChildByName("Bg").getChildByName("BtnConfirmWork").active = true;

            this.personEditBox.getChildByName("Bg").getChildByName("BtnConfirmCompany").active = false;

            this.personEditBox.getChildByName("Bg").getChildByName("EditBox").getComponent(EditBox).string = contetn.work;

        } else if (type == "Company") {

            this.personEditBox.getChildByName("Bg").getChildByName("BtnConfirmWork").active = false;

            this.personEditBox.getChildByName("Bg").getChildByName("BtnConfirmCompany").active = true;

            this.personEditBox.getChildByName("Bg").getChildByName("EditBox").getComponent(EditBox).string = contetn.company;
        }
    }

    /**
     * 点击修改名称
     */
    onClickEditWorkCompany(event, customEventData: string) {

        let str = this.personEditBox.getChildByName("Bg").getChildByName("EditBox").getComponent(EditBox).string;

        if (str == "") {

            this.onOpenTitlePopu("提示", "请输入要修改的内容!");

            return;
        }

        if (customEventData == "Work") {

            this.sendEvent(HomeView.editUserInfo, { work: str, company: "", roleType: "" });

        } else if (customEventData == "Company") {

            this.sendEvent(HomeView.editUserInfo, { company: str, work: "", roleType: "" });
        }
    }

    /**
     * 关闭编辑框
     * @param title 标题
     * @param type 类型
     */
    onClosePersonEditBox() {

        this.personEditBox.active = false;
    }


    /**
     * 提示
     */
    onBtnTitle() {
        UIAPI.getInstance().showMessegeBox("提示", "功能暂未开发!", "取消", "确认", () => { });
    }

    /**
     * 打开弹窗提示
     * @param title 标题 
     * @param content 内容
     */
    onOpenTitlePopu(title: string, content: string) {

        this.titlePopu.getChildByName("Bg").getChildByName("Title").getComponent(Label).string = title;

        this.titlePopu.getChildByName("Bg").getChildByName("Content").getComponent(Label).string = content;

        this.titlePopu.active = true;
    }

    /**
     * 关闭弹窗
     */
    onCloseTitlePopu() {

        this.titlePopu.active = false;
    }

    /**
     * 播放烟花
     */
    onOpenFirework() {

        this.fireworks.resetSystem();

        this.scheduleOnce(() => { this.fireworks.stopSystem(); }, 10);
    }

    /**
     * 跳舞
     */
    onDanceClick() {

        this.sendEvent(HomeView.danceClick);
    }

    /**
     * 跳舞
     */
    playerDance() {

        this.danceType++;

        if (this.danceType > 1) {

            this.danceType = 0;
        }

        this.gameManager.sendClientInput({

            type: 'PlayerDance',

            danceType: this.danceType,

        }, this.gameManager.selfUserInfo);
    }

    /**
     * 打开图片页
     */
    openImagePage(self, params) {

        self.imagePage.getChildByName("ScrollView").getComponent(ScrollView).scrollToLeft(0.01);

        self.imagePage.active = true;
    }


    /**
     * 关闭图片页
     */
    onCloseImagePageClisk() {

        this.imagePage.active = false;
    }

    /**
     * 打开分页
     */
    openPageView(self, params) {

        self.pageView.getChildByName("PageView").getComponent(PageView).scrollToPage(0, 0.01);

        self.pageView.active = true;
    }

    /**
     * 打开公司简介
     */
    openIntroduce(self, params) {

        self.onOpenCapture(null, "RTIntroduce");
    }


    /**
     * 关闭分页
     */
    onClosePageViewClisk() {

        this.pageView.active = false;
    }

    /**
     * 打开视频页
     */
    openVideoPage(self, params) {

        if (self.videoPage.active) return;

        self.videoPage.active = true;

        self.videoPage.getChildByName("closeVideo").active = false

        self.videoPage.setScale(new Vec3(0, 0.01, 0.01));

        tween(self.videoPage)

            .to(0.25, { scale: new Vec3(1.4, 0.01, 0.01) }, { easing: "circOut" })

            .to(0.75, { scale: new Vec3(1.4, 1.4, 0.01) }, { easing: "circOut" })

            .call(() => {

                self.videoPage.getChildByName("closeVideo").active = true;

                let liveString = "https://wanlian2022.oss-cn-hangzhou.aliyuncs.com/metaverse/Flv/showroom.flv";

                self.akCtl.updatePlayerInfo(liveString, false);

                self.akCtl.play(liveString, false);
            })

            .start();
    }


    /**
     * 关闭视频页
     */
    onCloseVideoPageClick(self, params) {

        self.videoPage.getChildByName("closeVideo").active = false;

        tween(self.videoPage)

            .to(0.75, { scale: new Vec3(1.4, 0.01, 0.01) }, { easing: "expoOut" })

            .to(0.25, { scale: new Vec3(0, 0.01, 0.01) })

            .call(() => {

                self.videoPage.active = false;

                self.akCtl.stop();
            })

            .start();
    }


    //计算中文字符长度
    checksum(chars: string) {
        var fuhao = ['，', '。', '；', '！', '：', '【', '】', '…', '？', '“', '”', '—', '·', '、', '《', '》', '（', '）', '￥', '＠'];//一些中文符号
        var fuhao_code = [];
        for (var j = 0; j < fuhao.length; j++) {
            //console.log('---##--' , fuhao[j].charCodeAt(0)  );
            fuhao_code.push(fuhao[j].charCodeAt(0));
        }

        //console.log('---22222--' , fuhao_code  );

        var sum = 0;
        for (var i = 0; i < chars.length; i++) {
            var c = chars.charCodeAt(i);
            //console.log('---c---' , c);
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                //sum++;
                //一些数字、字母、英文符号等
            } else if (fuhao_code.indexOf(c) >= 0) {
                //一些中文符号
            } else {
                sum += 2;
            }
        }

        return sum / 2;
    }

    public static path(): string {

        return "prefab/ui/HomePage";
    }
}