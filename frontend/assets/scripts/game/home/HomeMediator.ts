import BaseMediator from "../../../default/mvc/core/base/BaseMediator";
import HomeView from "./HomeView";
import PlayerModel, { Player, PlayerStateType, RuntimeType, UserCardNameData } from "../../model/PlayerModel";
import HttpUtils from "../../../default/mvc/util/HttpUtils";
import { Facade } from "../../../default/mvc/core/Facade";
import OtherMediator from "../other/OtherMediator";
import OtherView from "../other/OtherView";
import Utils from "../../../default/standar/Utils";
import { assetManager, ImageAsset, SpriteFrame, Texture2D } from "cc";
import { UIAPI } from "../../../default/mvc/util/UIUtils/UIAPI";
import { ResStartMatch } from "../../shared/protocols/matchServer/PtlStartMatch";
import API from "../../API";
import { FrontConfig } from "../../FrontConfig";

export default class HomeMediator extends BaseMediator {

    public view: HomeView;

    private player: Player;     //玩家数据

    private matchRoomData: ResStartMatch;  //匹配返回房间参数

    public init(data?: any): void {

        this.matchRoomData = data;

        this.player = Facade.getInstance().getModel(PlayerModel).getPlayer();

        //下面进行一些简单的示例，开发时经常用到这些功能，微信内开发几乎必不可少

        this.view.initView(this.matchRoomData);

        this.initwechatBaseData();      //处理微信基础数据，例如头像、昵称、openid

        //this.dataStatistics();      //上传到服务器，进行数据统计

        //打开个人中心
        this.bindEvent(HomeView.openPerson, () => {

            this.view.OpenPerson(this.player);

        }, this);

        //打开编辑个人中心
        this.bindEvent(HomeView.openEditPerson, (str) => {

            this.view.onOpenPersonEditBox(str.title, str.type, this.player.userCardName);

        }, this);

        //编辑个人信息
        this.bindEvent(HomeView.editUserInfo, (str) => {

            let self = this;

            let param = {
                openid: this.player.openid,
                position: str.work,
                corporate_name: str.company,
                role_type: str.roleType
            }

            HttpUtils.Post(API.mergeUrl(API.user_edit), param, function (err: string, res: any) {

                //console.log(res);

                if (!err) {

                    res = JSON.parse(res);

                    if (res.code == 1) {

                        if (str.work != "") self.player.userCardName.work = str.work;

                        if (str.company != "") self.player.userCardName.company = str.company;

                        if (str.roleType != self.player.userCardName.skin) self.player.userCardName.skin = str.roleType;

                        self.view.onOpenTitlePopu("提示", "更换成功!");

                        self.view.OpenPerson(self.player, false);

                        self.view.onClosePersonEditBox();

                    } else {

                        self.view.onOpenTitlePopu("提示", res.msg);
                    }
                } else { self.view.onOpenTitlePopu("提示", "修改失败:" + res.msg); }
            });
        }, this);


        //获取名片夹列表
        this.bindEvent(HomeView.nameCardList, (keyword: string) => {

            this.getNameCardList(keyword);

        }, this);

        //获取名片
        this.bindEvent(HomeView.getOtherNameCard, (otherOpenId: string) => {

            this.getNameCard(otherOpenId);

        }, this);

        //交换名片
        this.bindEvent(HomeView.exchangeNameCard, (otherOpenId: string) => {

            this.exchangeNameCard(otherOpenId);

        }, this);

        //切换动画状态
        this.bindEvent(HomeView.EventChangeAnimationState, (str: "") => {

            // this.player.sportMode = this.player.sportMode == PlayerStateType.walk ? PlayerStateType.run : PlayerStateType.walk;

            // this.view.setWalkOrRunSpriteFrameByState(this.player.sportMode);        //切换贴图

        }, this);

        //跳舞
        this.bindEvent(HomeView.danceClick, () => {

            if (this.player.state == PlayerStateType.dance0 || this.player.state == PlayerStateType.dance1) {

                return;
            }

            this.view.playerDance();

        }, this);

        //重连
        this.bindEvent(HomeView.reconnection, () => {

            this.view.EnterGameScene(this.matchRoomData.roomId);

        }, this);
    }

    /**
     * 处理微信基础数据，例如头像、昵称、openid
     */
    initwechatBaseData() {

        const self = this;

        //获取地址栏信息，并保存
        this.player = this.getModel(PlayerModel).getPlayer();

        this.player.openid = Utils.getQueryVariable("openid");

        if (Facade.getInstance().getModel(PlayerModel).GetGameConfig().runtime == RuntimeType.Release) {

            if (!this.player.openid) {

                UIAPI.getInstance().showMessegeBox("提示", "登录失败，请重试", "取消", "确认", () => {

                    this.initwechatBaseData();
                });

                return;
            }
        }

        this.player.nickname = decodeURIComponent(Utils.getQueryVariable("nickname"));

        this.player.header = Utils.getQueryVariable("header");

        // this.view.nameText.string = this.player.nickname;  //绑定昵称

        //下载微信头像
        if (this.player.header != null) {

            assetManager.loadRemote<ImageAsset>(this.player.header + '?aa=aa.jpg', function (err, imageAsset) {

                if (!err) {

                    const spriteFrame = new SpriteFrame();

                    const texture = new Texture2D();

                    texture.image = imageAsset;

                    spriteFrame.texture = texture;

                    self.player.headersprite = spriteFrame;

                    self.view.headImg.spriteFrame = spriteFrame;  //绑定头像
                }
            });
        }

        this.getUserInfo();
    }


    /**
     * 获取用户公司职位信息
     */
    getUserInfo() {

        let self = this;

        let url = API.mergeUrl(API.get_user_info) + "?openid=" + this.player.openid + "&nickname=" + this.player.nickname + "&headimgurl=" + this.player.header + "&group=" + FrontConfig.group;

        HttpUtils.Get(url, function (err: string, res: any) {

            if (!err) {

                let jsonRes = JSON.parse(res);

                // console.log(res);

                if (jsonRes.code == 1) {

                    let data = jsonRes.data;

                    let userCardName = new UserCardNameData(self.player.openid, data.position, data.corporate_name, data.role_type, data.nickname, data.headimgurl);

                    self.player.userCardName = userCardName;

                    self.view.EnterGameScene(self.matchRoomData.roomId); //进入游戏

                } else {

                    self.view.onOpenTitlePopu("提示", res.msg);
                }
            } else { self.view.onOpenTitlePopu("提示", "获取用户信息失败:" + res.msg); }
        });
    }

    /**
     * 获取名片夹列表
     * @param keyword 关键词
     */
    getNameCardList(keyword: string) {

        let self = this;

        let url = API.mergeUrl(API.exchange_list) + "?openid=" + this.player.openid + "&value=" + keyword;

        HttpUtils.Get(url, function (err: string, res: any) {

            //console.log(res);

            if (!err) {

                res = JSON.parse(res);

                if (res.code == 1) {

                    let list = res.data.list;

                    let nameCardArr: UserCardNameData[] = [];

                    for (let i = 0; i < list.length; i++) {

                        let obj = new UserCardNameData(list[i].openid, list[i].position, list[i].corporate_name, list[i].role_type, list[i].nickname, list[i].headimgurl);

                        nameCardArr.push(obj);
                    }

                    self.view.bindNameCardInfo(nameCardArr);

                } else {

                    self.view.onOpenTitlePopu("提示", res.msg);
                }
            } else { self.view.onOpenTitlePopu("提示", "获取名片夹列表失败:" + res.msg); }
        });
    }

    /**
     * 获取名片夹
     * @param otherOpenId openid
     */
    getNameCard(otherOpenId: string) {

        let self = this;

        let url = API.mergeUrl(API.get_exuser_info) + "?openid=" + this.player.openid + "&ex_openid=" + otherOpenId;

        HttpUtils.Get(url, function (err: string, res: any) {

            //console.log(res);

            if (!err) {

                res = JSON.parse(res);

                if (res.code == 1) {

                    let obj = new UserCardNameData(otherOpenId, res.data.position, res.data.corporate_name, res.data.role_type, res.data.nickname, res.data.headimgurl, res.data.is_exchange);

                    self.view.bindPopuNameCardInfo(obj);

                } else {

                    self.view.onOpenTitlePopu("提示", res.msg);
                }
            } else { self.view.onOpenTitlePopu("提示", "获取名片夹列表失败:" + res.msg); }
        });
    }

    /**
     * 交换名片
     * @param otherOpenId 
     */
    exchangeNameCard(otherOpenId: string) {

        let self = this;

        let param = {
            openid: this.player.openid,
            ex_openid: otherOpenId,
        }

        HttpUtils.Post(API.mergeUrl(API.add_exuser), param, function (err: string, res: any) {

            //console.log(res);

            if (!err) {

                res = JSON.parse(res);

                if (res.code == 1) {

                    self.view.hideExchangeBtn();

                    self.view.onOpenTitlePopu("名片交换成功!", "您已成功交换名片,可在名片夹中查看!");

                } else {

                    self.view.onOpenTitlePopu("提示", res.msg);
                }
            } else { self.view.onOpenTitlePopu("提示", "交换名片失败:" + res.msg); }
        });
    }

    /**
     * 上传到服务器，进行数据统计
     */
    dataStatistics() {

        let url = "http://platform.qdmedia.cc/ActivityData/addData";

        let param = {
            serial: "4xgn4C",
            data: new Date().toLocaleString() + "," + this.player.nickname + "," + this.player.header + "," + this.player.openid,
        }

        return;     //由于会真正上传，所以暂时关闭

        HttpUtils.Post(url, param, function (err: string, res: any) {

            if (!err) {

                console.log("上传统计数据成功");
            }
        });
    }

    //页面初始化时，调用
    public viewDidAppear(): void {

        //this.view.init();
    }

    //删除时调用
    public destroy(): void {

    }
}