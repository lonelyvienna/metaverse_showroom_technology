/*
 * @Author: guofuyan
 * @Date: 2022-06-16 21:34:12
 * @LastEditTime: 2022-06-16 23:15:56
 * @LastEditors: guofuyan
 * @Description:
 */
import { _decorator } from "cc";
import { BaseView } from "../../../default/mvc/core/base/BaseView";
import { Facade } from "../../../default/mvc/core/Facade";
import AudioUtil from "../../../default/mvc/util/AudioUtil";
import UIEffectHelper from "../../../default/standar/UIEffectHelper";
import { NetUtil } from "../../NetUtil";
import HomeMediator from "../home/HomeMediator";
import HomeView from "../home/HomeView";

const { ccclass, property } = _decorator;

@ccclass
export default class OtherView extends BaseView {

    public static readonly Enter = "Enter";

    public init(data?: any): void {

        UIEffectHelper.fade(this.node);     //淡入
    }

    OnClick() {

        var self = this;

        AudioUtil.playEffect("audioclip/effect");       //播放音效

        //淡出效果
        UIEffectHelper.fade(this.node, false, function () {

            self.sendEvent(OtherView.Enter, "");     //返回上一页
        });
    }

    async onBtnMatch() {
        let ret = await NetUtil.matchClient.callApi('StartMatch', {}, { timeout: 10000 });

        if (!ret.isSucc) {
            return alert('暂时没有可加入的房间，稍后再试试吧~');
        }

        console.log(ret.res);

        this.node.active = false;

        Facade.getInstance().openView(HomeMediator, HomeView, ret.res);

        // SceneUtil.loadScene('RoomScene', {
        //     ...ret.res,
        //     nickname: this.inputNickname.string
        // });
    }

    public static path(): string {

        return "prefab/ui/OtherPage";
    }
}