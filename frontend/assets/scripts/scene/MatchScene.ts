import { _decorator, Component, Node, ProgressBar, director, Label, AssetManager, assetManager, ImageAsset, SpriteFrame, Texture2D, resources, Prefab } from 'cc';
import { Facade } from '../../default/mvc/core/Facade';
import { UIAPI } from '../../default/mvc/util/UIUtils/UIAPI';
import Utils from '../../default/standar/Utils';
import PlayerModel, { Player, RuntimeType } from '../model/PlayerModel';
import { NetUtil } from '../NetUtil';
import { SceneUtil } from '../SceneUtil';
import { ResStartMatch } from '../shared/protocols/matchServer/PtlStartMatch';
const { ccclass, property } = _decorator;

@ccclass('MatchScene')
export class MatchScene extends Component {

    @property(ProgressBar)
    public progressBar!: ProgressBar;   //进度条

    @property(Label)
    public title!: Label;   //进度条

    @property(Node)
    public popup!: Node;   //弹窗

    @property(Label)
    public popupContent!: Label;   //弹窗内容文本

    private player: Player;     //玩家数据

    private resData: ResStartMatch = null;

    onLoad() {
        document.getElementById("splash").style.visibility = "hidden";

        let self = this;

        this.progressBar.node.active = true;

        this.title.node.active = true;

        this.progressBar.progress = 0;

        this.title.string = "加载资源中...";

        director.preloadScene("RoomScene", self.onProgress.bind(this), () => {

            console.log("preload success!");

            self.title.string = "正在载入场景...";

            self.EnterRoomScene();
        });
    }

    start() {

        this.initwechatBaseData();      //处理微信基础数据，例如头像、昵称、openid
    }

    EnterRoomScene() {

        if (this.resData && this.resData.serverUrl != null) {

            SceneUtil.loadScene('RoomScene', {

                ...this.resData
            });

        } else {

            this.scheduleOnce(() => { this.EnterRoomScene(); }, 0.1);
        }
    }

    onProgress(completedCount: number, totalCount: number) {

        this.progressBar.progress = completedCount / totalCount;
    }

    /**
     * 处理微信基础数据，例如头像、昵称、openid
     */
    async initwechatBaseData() {

        let self = this;

        //获取地址栏信息，并保存
        this.player = Facade.getInstance().getModel(PlayerModel).getPlayer();

        this.player.openid = Utils.getQueryVariable("openid");

        if (Facade.getInstance().getModel(PlayerModel).GetGameConfig().runtime == RuntimeType.Release) {

            if (!this.player.openid) {

                this.popup.active = true;

                this.popupContent.string = "请授权完整服务以继续";

                return;
            }
        }

        this.player.nickname = decodeURIComponent(Utils.getQueryVariable("nickname"));

        this.player.header = Utils.getQueryVariable("header");

        let ret = await NetUtil.matchClient.callApi('StartMatch', {}, { timeout: 10000 });

        if (!ret.isSucc) {

            this.popup.active = true;

            this.popupContent.string = "服务器连接失败";

            return;
        }

        self.resData = ret.res;
    }
}
