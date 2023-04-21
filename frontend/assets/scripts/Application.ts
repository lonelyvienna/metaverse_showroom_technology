/*
 * @Author: guofuyan
 * @Date: 2022-06-16 01:00:26
 * @LastEditTime: 2023-02-22 23:51:39
 * @LastEditors: guofuyan
 * @Description:入口页
 */
import PlayerModel from "./model/PlayerModel";
import HomeMediator from "./game/home/HomeMediator";
import HomeView from "./game/home/HomeView";
import { Component, director, dynamicAtlasManager, size, _decorator, Node } from "cc";
import { Facade } from "../default/mvc/core/Facade";
import { GameController } from "./game/player/GameController";
import OtherMediator from "./game/other/OtherMediator";
import OtherView from "./game/other/OtherView";
import { SceneUtil } from "./SceneUtil";


const { ccclass, property } = _decorator;

@ccclass
export default class Application extends Component {

    onLoad() {

        dynamicAtlasManager.enabled = false;
    }

    start() {

        const self = this;

        //初始化框架
        Facade.getInstance().init(false, size(750, 1448), true, false);      //这个分辨率扣除了微信顶部栏和IPhone顶部状态栏

        //注册数据对象
        this.initModel();

        //音乐图标,放置于顶层
        // Facade.getInstance().addLayer(OtherMediator, OtherView, 1, "");

        //打开第一个界面
        // Facade.getInstance().openView(HomeMediator, HomeView, SceneUtil.sceneParams);

        //连接Websocket
        //Socket.getInstance().connect("standarcocos");

        //开始游戏
        //director.getScene().addChild(new Node().addComponent(GameController).node);

        Facade.getInstance().getModel(PlayerModel).startGame();     //数据层状态切换
    }

    /**
     *注册数据对象
     */
    initModel(): void {

        Facade.getInstance().registerModel(PlayerModel);
    }
}
