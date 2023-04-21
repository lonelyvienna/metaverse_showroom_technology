/*
 * @Author: guofuyan
 * @Date: 2022-07-16 00:04:25
 * @LastEditTime: 2022-07-24 11:52:08
 * @LastEditors: guofuyan
 * @Description:
 */
import { _decorator, Component, Node, Prefab, instantiate, Scene, director, find, Animation, Camera, Tween, tween } from 'cc';
import { Facade } from '../../../default/mvc/core/Facade';
import ITResourceLoader from '../../../default/mvc/loader/ITResourceLoader';
import PlayerModel, { Player } from '../../model/PlayerModel';
import OrbitCamera from './OrbitCamera';
import { PlayerCtl } from './PlayerCtl';
const { ccclass, property } = _decorator;

@ccclass('GameController')
export class GameController extends Component {

    @property(Node)
    public player: Node;

    private mainCamera: OrbitCamera;     //主相机

    start() {

        this.node.name = "GameController";      //本节点名称

        this.mainCamera = find("Main Camera").getComponent(OrbitCamera);

        this.mainCamera.pause = true;        //关闭画面旋转

        this.loadGalleryAndPlayer();     //加载美术馆和玩家
    }

    /**
     * 加载美术馆和玩家
     */
    async loadGalleryAndPlayer() {

        var self = this;

        //加载美术馆
        await ITResourceLoader.loadPrefab("prefab/game/Gallery").then(res => {

            director.getScene().addChild(res);
        });

        //加载玩家
        await ITResourceLoader.loadPrefab("prefab/game/Player").then(res => {

            director.getScene().addChild(res);

            self.player = res;

            let playerCtl = res.getComponent(PlayerCtl);

            playerCtl.node_camera = self.mainCamera.node;

            //self.mainCamera.target = res.getChildByName("CameraTarget");

        }).then(() => {

            self.startGame();

            self.loadArtImage();
        });
    }

    /**
     * //加载艺术画作到墙壁
     */
    async loadArtImage() {

        await ITResourceLoader.loadRes("prefab/game/画框", Prefab, (err: any, res: Prefab) => {

            if (!err) {

                let node = instantiate(res);        //实例化

                find("Gallery").addChild(node);     //添加到场景
            }
        });

        await ITResourceLoader.loadRes("prefab/game/文字", Prefab, (err: any, res: Prefab) => {

            if (!err) {

                let node = instantiate(res);        //实例化

                find("Gallery").addChild(node);     //添加到场景
            }
        });
    }

    /**
     * 开始游戏
     */
    startGame() {

        //有些手机失效
        // let cameraAnimation = this.mainCamera.node.getComponent(Animation);
        // cameraAnimation.play();     //播放相机进入动画

        //相机推进动画
        this.mainCamera.radius = 200;

        tween(this.mainCamera)
        .to(4.0, { radius: 3 })
        .start()

        Facade.getInstance().getModel(PlayerModel).startGame();     //数据层状态切换

        this.scheduleOnce(() => {

            this.mainCamera.pause = false;     //开启触控

        }, 4);
    }
}