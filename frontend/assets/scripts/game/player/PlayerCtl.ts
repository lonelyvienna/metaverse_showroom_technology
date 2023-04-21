/*
 * @Author: guofuyan
 * @Date: 2022-07-15 20:58:53
 * @LastEditTime: 2023-03-01 00:47:57
 * @LastEditors: guofuyan
 * @Description: 玩家角色控制
 */
const CELL_TIME = 0.016;

// 速度
const SPEED = 1;

import { _decorator, Component, Node, Vec3, SkeletalAnimationComponent, macro, Button, animation, math, v3, tween, debug, Camera, Vec2, RigidBody, input, Input, geometry, EventTouch, PhysicsSystem, CapsuleCollider, director, tweenUtil } from 'cc';
import { Facade } from '../../../default/mvc/core/Facade';
import EventMgr from '../../../default/standar/event/EventMgr';
import { GameManager } from '../../GameManager';
import PlayerModel, { Player, PlayerStateType } from '../../model/PlayerModel';
import { RoomUserState } from '../../shared/game/state/RoomUserState';
import { TweenPool } from '../../TweenPool';
import HomeView from '../home/HomeView';
import { Chair } from './Chair';
const { ccclass, property } = _decorator;

@ccclass('PlayerCtl')
export class PlayerCtl extends Component {

    @property(Node)
    node_role: Node | null = null;

    @property(Node)
    node_head: Node | null = null;

    private _animationController: animation.AnimationController | null = null;

    // 移动速度
    private _vector: Vec3 = Vec3.ZERO;

    private _targetPos = new Vec3(0, 0, 0);
    private _tweens = new TweenPool;

    playerId: string;
    isSelf = false;
    state!: RoomUserState;

    @property(Node)
    node_camera: Node | null = null;

    private _rigiBody: RigidBody;
    private player: Player = null;      //用户数据
    private gameManager: GameManager;
    private skin: string; //角色皮肤

    onLoad() {

        this._animationController = this.node_role!.getComponent(animation.AnimationController);

        this._rigiBody = this.node.getComponent(RigidBody);

        this.gameManager = director.getScene().getChildByName("Canvas").getChildByName("HomePage").getComponent(HomeView).gameManager;

        // EventMgr.getInstance().registerListener("joysitck", this, this.joysitckHandle);       //监听摇杆数据

        EventMgr.getInstance().registerListener("InputJump", this, this.jump);       //跳跃
    }

    onEnable() {

        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDisable() {

        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    init(state: RoomUserState, isSelf: boolean) {

        this.playerId = state.userInfo.id;

        this.isSelf = isSelf;

        if (this.isSelf) {

            this.node_camera = this.node.parent.parent.getChildByName("Main Camera");
        }

        this.player = Facade.getInstance().getModel(PlayerModel).getPlayer();

        this.skin = state.userInfo.skin;
    }

    updateState(state: RoomUserState) {

        this.state = state;

        this.isSelf ? this._resetState(state) : this._tweenState(state);
    }

    // 直接更新
    private _resetState(state: RoomUserState) {

        if (this.skin != state.userInfo.skin) {

            EventMgr.getInstance().sendListener("PlayerSkin", { "userInfo": state.userInfo });

            return;
        }

        if (state.speedDirX == 0 && state.speedDirY == 0) {  //没有移动

            if (!this.node.position.equals(this._targetPos)) {

                if (this._targetPos.x == 0 && this._targetPos.y == 0) {

                    this.node.setPosition(new Vec3(state.pos.x, 0, state.pos.y));

                    this._targetPos.set(this.node.getPosition());
                }
            }

            if (state.type == "sit") {

                //播放坐下动画
                this.setPlayerState(PlayerStateType.sit);

                //关闭玩家的碰撞体
                this.node.getComponent(CapsuleCollider).enabled = false;

                this.node.getComponent(RigidBody).enabled = false;

                //改变玩家位置，坐下
                this.node.setWorldPosition(new Vec3(state.chairPosX, 0, state.chairPosZ));

                this.node.setWorldRotationFromEuler(0, 30, 0);       //改变朝向

                //标定玩家的状态
                this.player.sportMode = PlayerStateType.sit;

                this.player.state = PlayerStateType.sit;

                this.gameManager.sendClientInput({

                    type: 'PlayerPos',

                    pos: {

                        x: state.chairPosX,

                        y: state.chairPosZ,
                    },

                }, state.userInfo);

            } else if (state.type == "up") {

                this.setPlayerState(PlayerStateType.idle);

                if (!this.node.getComponent(CapsuleCollider).enabled) {

                    //开启玩家的碰撞体
                    this.node.getComponent(CapsuleCollider).enabled = true;

                    this.node.getComponent(RigidBody).enabled = true;

                    //设定位置
                    this.node.setWorldPosition(new Vec3(this.node.getWorldPosition().x, 0, this.node.getWorldPosition().z));

                    this.gameManager.sendClientInput({

                        type: 'PlayerPos',

                        pos: {

                            x: this.node.position.x,

                            y: this.node.position.z,
                        },

                    }, state.userInfo);

                    //发送站起消息，显示按钮
                    this.scheduleOnce(() => {

                        EventMgr.getInstance().sendListener("PlayerSit", { "state": "sitUp" });

                    }, 1.6);
                }

            } else if (state.type == "dance") {

                switch (state.danceType) {

                    case 0:

                        this.player.state = PlayerStateType.dance0;

                        this.setPlayerState(PlayerStateType.dance0);

                        break;

                    case 1:

                        this.player.state = PlayerStateType.dance1;

                        this.setPlayerState(PlayerStateType.dance1);

                        break;

                    default:

                        break;
                }

            } else {

                this.setPlayerState(PlayerStateType.idle);

                this.player.state = PlayerStateType.idle;

                let vec = new Vec3(0, 0, 0);

                this._rigiBody.setLinearVelocity(vec);
            }

            return;
        }

        let pos = new Vec3(state.speedDirX, state.speedDirY, 0);

        Vec3.rotateZ(pos, pos, Vec3.ZERO, this.node_camera!.eulerAngles.y * macro.RAD);

        if (state.type == "walk") {

            this.setPlayerState(PlayerStateType.walk);

            this.player.state = PlayerStateType.walk;

        }

        if (state.angle != 0) {

            this.node_role!.eulerAngles = new Vec3(0, state.angle + 90 + this.node_camera!.eulerAngles.y, 0);
        }

        let vec = new Vec3(pos.x * state.speedTime, 0, -pos.y * state.speedTime);

        this._rigiBody.setLinearVelocity(vec);

        this.gameManager.sendClientInput({

            type: 'PlayerPos',

            pos: {

                x: this.node.position.x,

                y: this.node.position.z,
            },

        }, state.userInfo);
    }

    // 插值更新
    private _tweenState(state: RoomUserState) {

        if (this.skin != state.userInfo.skin) {

            EventMgr.getInstance().sendListener("PlayerSkin", { "userInfo": state.userInfo });

            return;
        }

        if (state.speedDirX == 0 && state.speedDirY == 0) {  //没有移动

            if (!this.node.position.equals(this._targetPos)) {

                if (this._targetPos.x == 0 && this._targetPos.z == 0) {

                    this.node.setPosition(new Vec3(state.pos.x, 0, state.pos.y));

                    this._targetPos.set(this.node.getPosition());
                }
            }

            if (state.type == "sit") {

                this.setPlayerState(PlayerStateType.sit);

                //关闭玩家的碰撞体
                this.node.getComponent(CapsuleCollider).enabled = false;

                this.node.getComponent(RigidBody).enabled = false;

                //改变玩家位置，坐下
                this.node.setWorldPosition(new Vec3(state.chairPosX, 0, state.chairPosZ));

                //玩家转向，正坐着椅子
                this.node.setRotationFromEuler(new Vec3(0, 30, 0));

                this.gameManager.sendClientInput({

                    type: 'PlayerPos',

                    pos: {

                        x: state.chairPosX,

                        y: state.chairPosZ,
                    },

                }, state.userInfo);

            } else if (state.type == "up") {

                this.setPlayerState(PlayerStateType.idle);

                if (!this.node.getComponent(CapsuleCollider).enabled) {

                    //开启玩家的碰撞体
                    this.node.getComponent(CapsuleCollider).enabled = true;

                    this.node.getComponent(RigidBody).enabled = true;

                    //改变玩家位置，坐起
                    this.node.setWorldPosition(new Vec3(this.node.getWorldPosition().x, 0, this.node.getWorldPosition().z));

                    this.gameManager.sendClientInput({

                        type: 'PlayerPos',

                        pos: {

                            x: this.node.position.x,

                            y: this.node.position.z,
                        },

                    }, state.userInfo);
                }

            } else if (state.type == "dance") {

                switch (state.danceType) {

                    case 0:

                        this.setPlayerState(PlayerStateType.dance0);

                        break;

                    case 1:

                        this.setPlayerState(PlayerStateType.dance1);

                        break;

                    default:

                        break;
                }

            } else {

                this.setPlayerState(PlayerStateType.idle);

                let vec = new Vec3(0, 0, 0);

                this._rigiBody.setLinearVelocity(vec);
            }

            return;
        }

        let pos = new Vec3(state.speedDirX, state.speedDirY, 0);

        Vec3.rotateZ(pos, pos, Vec3.ZERO, state.cameraRotateY * macro.RAD);

        let vec = new Vec3(pos.x * state.speedTime, 0, -pos.y * state.speedTime);

        this._rigiBody.setLinearVelocity(vec);

        this._tweens.add(tween(this.node_role)

            .call(() => {

                let temp = new Vec3(0, state.angle + 90 + state.cameraRotateY, 0);

                Vec3.lerp(temp, this.node_role.eulerAngles, temp, 1);

                // console.log("temp: ", temp);

                this.node_role!.eulerAngles = temp;
            })

            .start());

        if (state.type == "walk") {

            this.setPlayerState(PlayerStateType.walk);

        }

        this.gameManager.sendClientInput({

            type: 'PlayerPos',

            pos: {

                x: this.node.position.x,

                y: this.node.position.z,
            },

        }, state.userInfo);
    }

    /**
     * 设置玩家的动作
     */
    setPlayerState(state: PlayerStateType) {

        switch (state) {

            case PlayerStateType.idle:

                //设置动画状态，休息
                this._animationController?.setValue('sit', false);
                this._animationController?.setValue('walk', false);
                this._animationController?.setValue('dance0', false);
                this._animationController?.setValue('dance1', false);

                break;

            case PlayerStateType.walk:

                //设置动画状态，走路
                this._animationController?.setValue('sit', false);
                this._animationController?.setValue('walk', true);
                this._animationController?.setValue('dance0', false);
                this._animationController?.setValue('dance1', false);

                break;

            case PlayerStateType.sit:

                //设置动画状态，坐
                this._animationController?.setValue('sit', true);
                this._animationController?.setValue('walk', false);
                this._animationController?.setValue('dance0', false);
                this._animationController?.setValue('dance1', false);

                break;

            case PlayerStateType.dance0:

                //设置动画状态，跳舞
                this._animationController?.setValue('sit', false);
                this._animationController?.setValue('walk', false);
                this._animationController?.setValue('dance0', true);
                this._animationController?.setValue('dance1', false);

                break;

            case PlayerStateType.dance1:

                //设置动画状态，跳舞
                this._animationController?.setValue('sit', false);
                this._animationController?.setValue('walk', false);
                this._animationController?.setValue('dance0', false);
                this._animationController?.setValue('dance1', true);

                break;
        }
    }


    private _ray: geometry.Ray = new geometry.Ray();
    onTouchEnd(event: EventTouch) {

        if (!this.isSelf) return;

        const sub = event.getStartLocation().subtract(event.getLocation()).length();

        if (sub > 5) return;

        const touch = event.touch!;

        let point = this.node_camera.getComponent(Camera).screenToWorld(new Vec3(touch.getLocationX(), touch.getLocationY(), 0))

        geometry.Ray.fromPoints(this._ray, this.node_camera.worldPosition, point);

        if (PhysicsSystem.instance.raycast(this._ray)) {

            const raycastResults = PhysicsSystem.instance.raycastResults;

            for (let i = 0; i < raycastResults.length; i++) {

                const item = raycastResults[i];

                //console.log(item.collider.node.name);

                let selfPos = new Vec3(this.node.position.x, 0, this.node.position.z);

                let otherPos = new Vec3(item.collider.node.position.x, 0, item.collider.node.position.z);

                let disX = selfPos.x - otherPos.x;

                let disY = selfPos.y - otherPos.y;

                let disZ = selfPos.z - otherPos.z;

                let distance: number = Math.sqrt(disX * disX + disY * disY + disZ * disZ);

                switch (item.collider.node.name) {

                    case "SitTip":

                        this.sitDowm(item.collider.node.parent);        //坐在位置上

                        break;

                    case "Image":

                        if (distance < 10) {

                            EventMgr.getInstance().sendListener("OpenImage", null);  //打开图片页
                        }

                        break;

                    case "Page":

                        if (distance < 10) {

                            EventMgr.getInstance().sendListener("OpenPage", null);  //打开分页
                        }

                        break;

                    case "Introduce":

                        if (distance < 8) {

                            EventMgr.getInstance().sendListener("OpenIntroduce", null);  //打开简介
                        }

                        break;

                    case "VideoBtn":

                        if (distance < 15) {

                            EventMgr.getInstance().sendListener("OpenVideo", null);  //打开视频
                        }

                        break;

                    case "closeVideo":

                        EventMgr.getInstance().sendListener("CloseVideo", null);  //关闭视频

                        break;

                    default:

                        break;
                }
            }
        }
    }

    /**
     * 坐在位置上
     */
    sitDowm(chair: Node) {

        this.player.onChairNode = chair.getComponent(Chair);        //记录目前坐在哪一张椅子上

        chair.getComponent(Chair).takeASeat();      //入座

        this.gameManager.sendClientInput({  //发送坐下信息

            type: 'PlayerSit',

            sport: PlayerStateType.sit,

            chairName: chair.name,

            chairPos: { x: chair.worldPosition.x + 0.4, z: chair.worldPosition.z + 0.7 },

        }, this.gameManager.selfUserInfo);

        EventMgr.getInstance().sendListener("PlayerSit", { "state": "sitDown" });
    }

    /**
     * 跳跃或站起来
     */
    jump(self, params: any) {

        if (!self.isSelf) return;

        //如果是坐的姿态，则站起来
        if (self.player.state == PlayerStateType.sit) {

            self.gameManager.sendClientInput({  //发送站起信息

                type: 'PlayerSit',

                sport: PlayerStateType.idle,

                chairName: self.player.onChairNode.node.name,

                chairPos: { x: 0, z: 0 },

            }, self.gameManager.selfUserInfo);

            if (params.currentSportMode == "walk")

                self.player.sportMode = PlayerStateType.walk;

            self.player.onChairNode.standUp();      //玩家站起来，离开椅子

            self.player.onChairNode = null;
        }
    }
}