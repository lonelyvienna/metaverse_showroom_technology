/*
 * @Author: guofuyan
 * @Date: 2023-02-24 18:17:19
 * @LastEditTime: 2023-02-26 22:53:58
 * @Description:
 */
import { _decorator, Component, Node, director, Vec3, instantiate, Prefab, tween, BoxCollider } from 'cc';
import { Facade } from '../../../default/mvc/core/Facade';
import ITResourceLoader from '../../../default/mvc/loader/ITResourceLoader';
import { GameManager } from '../../GameManager';
import PlayerModel, { Player, PlayerStateType } from '../../model/PlayerModel';
import { PlayerCtl } from './PlayerCtl';
const { ccclass, property } = _decorator;

@ccclass('Chair')
export class Chair extends Component {

    public personSittingState: boolean = false;     //位置是否有人

    private sitTip: Node = null;        //坐下的标识

    private mainCamera: Node = null;

    private playerNode: Node = null;

    private isPlayerIn: boolean = false;       //玩家是否进入显示坐下图标的范围
    private preIsPlayerIn: boolean = false;        //玩家是否进入的前一个状态
    private player: Player = null;      //用户数据

    public gameManager!: GameManager;

    public start() {

        //查找相机
        this.mainCamera = director.getScene().getChildByName("Main Camera");

        this.player = Facade.getInstance().getModel(PlayerModel).getPlayer();

        this.creatSitTip();     //如果不存在节点，创建
    }

    UpdateState(playerParentNode: Node) {

        if (!playerParentNode || !this.sitTip) return;     //如果有人坐在位置，则不进行以下的操作

        //面向摄像机
        if (this.sitTip.activeInHierarchy) this.sitTip.lookAt(this.mainCamera.position);

        //判断与玩家的距离，决定是否显示“坐下”标记
        for (let i = 0; i < playerParentNode.children.length; i++) {

            let player = playerParentNode.children[i].getComponent(PlayerCtl)!;

            if (player && player.isSelf) {

                let action = () => {

                    this.playerNode = player.node;

                    if (Vec3.distance(this.node.worldPosition, this.playerNode.worldPosition) < 2) this.isPlayerIn = true;

                    else this.isPlayerIn = false;

                    //如果用户是坐着的，则任何椅子不再检测是否靠近
                    if (player.state.type == "sit" || player.state.type == "up") this.isPlayerIn = false;

                    //用户进入或者离开识别范围，进行“坐下”标记的动画
                    if (this.isPlayerIn != this.preIsPlayerIn) {

                        if (this.isPlayerIn)
                            tween(this.sitTip)
                                .to(.5, { scale: new Vec3(-0.4, 0.4, 0.4) })
                                .start()
                        else
                            tween(this.sitTip)
                                .to(.5, { scale: Vec3.ZERO })
                                .start()

                        this.preIsPlayerIn = this.isPlayerIn;
                    }
                };

                if (playerParentNode.children.length == 1) {

                    action();

                } else {

                    for (let j = 0; j < playerParentNode.children.length; j++) {

                        let otherPlayer = playerParentNode.children[j].getComponent(PlayerCtl)!;

                        if (i == j) {  //自己不跟自己判断

                            continue;
                        }

                        if (otherPlayer.state.type == "sit") {  //其他玩家坐着，找到坐的位置

                            let chairName = otherPlayer.state.chairName;

                            if (chairName == this.node.name) {  //当前椅子被玩家坐着

                                this.personSittingState = true;

                                this.sitTip.setScale(Vec3.ZERO);

                                return;
                            }
                        } else if (otherPlayer.state.type == "up") {

                            let name = otherPlayer.state.chairName;

                            if (name == this.node.name) {  //玩家从当前椅子起来

                                this.scheduleOnce(() => {

                                    this.personSittingState = false;

                                }, 1.6);
                            }
                        }

                        action();
                    }
                }

                break;
            }
        }
    }

    /**
     * 创建提示
     */
    creatSitTip() {

        var self = this;

        ITResourceLoader.loadRes("prefab/game/SitTip", Prefab, (err: any, res: Prefab) => {

            if (!err) {

                self.sitTip = instantiate(res);        //实例化

                self.node.addChild(self.sitTip);     //添加到场景

                self.sitTip.setScale(Vec3.ZERO);        //默认隐藏
            }
        });
    }

    /**
     * 坐下
     */
    takeASeat() {

        this.personSittingState = true;

        this.sitTip.setScale(Vec3.ZERO);
    }

    /**
     * 站起来
     */
    standUp() { this.personSittingState = false; }
}