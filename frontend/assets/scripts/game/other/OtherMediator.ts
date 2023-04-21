/*
 * @Author: guofuyan
 * @Date: 2022-06-16 21:34:12
 * @LastEditTime: 2022-06-16 23:15:36
 * @LastEditors: guofuyan
 * @Description:
 */
import OtherView from "./OtherView";
import HomeMediator from "../home/HomeMediator";
import HomeView from "../home/HomeView";
import BaseMediator from "../../../default/mvc/core/base/BaseMediator";
import { Facade } from "../../../default/mvc/core/Facade";
import AudioUtil from "../../../default/mvc/util/AudioUtil";

export default class OtherMediator extends BaseMediator {

    public view: OtherView;

    public init(data?: any): void {

        this.bindEvent(OtherView.Enter, (str: "") => {

            Facade.getInstance().openView(HomeMediator, HomeView, str);

            this.view.closeView();      //关闭面板

        }, this);
    }

    //页面初始化时，调用
    public viewDidAppear(): void {

        //this.view.init();
    }

    //删除时调用
    public destroy(): void {

    }
}