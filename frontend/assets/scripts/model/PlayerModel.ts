/*
 * @Author: guofuyan
 * @Date: 2022-06-16 11:00:17
 * @LastEditTime: 2023-02-23 23:03:51
 * @Description: 玩家数据类
 */

import { SpriteFrame } from "cc";
import BaseModel from "../../default/mvc/core/base/BaseModel";
import { Chair } from "../game/player/Chair";
import Notification from "../Notification";

export default class PlayerModel extends BaseModel {

    private _player: Player;

    public _gameConfig: GameConfig;        //游戏中的设置，例如播放背景音乐等

    public isGaming: boolean = false;          //游戏是否开始

    public init(): void {

        console.log("初始化用户数据模块");

        this._player = new Player("");

        this._gameConfig = new GameConfig();
    }

    public GetGameConfig(): GameConfig {

        return this._gameConfig;
    }

    /**
     * 开始游戏
     */
    startGame() {

        this.isGaming = true;       //开始游戏

        this.sendNoti(Notification.StartGame, "");
    }

    public getPlayer(): Player {

        return this._player;
    }

    /**
     * 切换音乐播放状态
     * @param isPlaying 音乐的播放状态
     */
    public musicStateChange(isPlaying: boolean): void {

        this._gameConfig.musicIsPlaying = isPlaying;

        if (isPlaying) {

            this.sendNoti(Notification.MUSIC_PLAYING);

        } else {

            this.sendNoti(Notification.MUSIC_PAUSE);
        }
    }

    public clear(): void {

    }
}

/**
 * 游戏中基础信息
 */
export class Player {

    public openid: string;      //微信openid

    public wechatid: string;    //微信wechatid

    public nickname: string;     //微信名称

    public header: string;       //微信头像

    public state: PlayerStateType = PlayerStateType.idle;      //角色的状态

    public sportMode: PlayerStateType = PlayerStateType.walk;      //角色运动的模式，如果滑动摇杆是跑还是走

    public headersprite: SpriteFrame

    public onChairNode: Chair = null;      //用户坐的椅子

    public userCardName: UserCardNameData = null;  //用户名片信息

    public constructor(openid: string) {

        this.openid = openid;

        //this.writeDebugData();
    }

    /**
     * 测试数据
     */
    /* private writeDebugData() {

         this.areaInfoList.push(new AreaInfo("全部"));
     }*/
}

/**
 * 玩家的动作
 */
export enum PlayerStateType {

    idle,
    walk,
    run,
    sit,
    jump,
    dance0,
    dance1,
}

/**
 * 用户信息
 */
export class UserCardNameData {

    public id: string;

    public work: string;

    public company: string;

    public skin: string;

    public nickname: string;     //微信名称

    public header: string;       //微信头像

    public isExchange: number;  //交换名片 0未交换 1已交换

    public constructor(
        id: string,
        work: string,
        company: string,
        skin: string,
        nickname: string,
        header: string,
        isExchange?: number,
    ) {
        this.id = id;
        this.work = work;
        this.company = company;
        this.skin = skin;
        this.nickname = nickname;
        this.header = header;
        this.isExchange = isExchange;
    }
}


/**
 * 运行环境
 */
export enum RuntimeType {
    Debug = "Debug",      //测试环境
    Release = "Release",        //正式环境
};

/**
 * 游戏配置信息
 */
export class GameConfig {

    public musicIsPlaying: boolean = true;        //背景音乐是否正在播放

    /**
     *使用测试环境或者正式环境，主要是控制接入的是探索ART的正是环境还是测试环境API
     *开启这里，构造函数内会自动操作：
     *(1)自动添加首页数字藏品的测试关键字
     *(2)自动关闭个人藏品的筛选
     */
    public runtime: RuntimeType = RuntimeType.Release;

    /**
     * 构造
     */
    constructor() {

        //如果是测试环境，则需要显示一些多余的数据来进行测试
        if (this.runtime == RuntimeType.Debug) {

            console.log("测试环境");
        }
    }
}
