/*
 * @Author: guofuyan
 * @Date: 2022-06-16 21:34:12
 * @LastEditTime: 2023-02-28 00:15:02
 * @LastEditors: guofuyan
 * @Description:
 */
import { Button, Label, _decorator } from "cc";
import { BaseView } from "../../core/base/BaseView";

const { ccclass, property } = _decorator;

@ccclass
export default class ShowMessegeBoxView extends BaseView {

    @property(Label)
    public title: Label;

    @property(Label)
    public content: Label;

    @property(Button)
    public Button0: Button;

    @property(Button)
    public Button1: Button;

    private callBack: Function;     //回调方法

    public init(data?: any): void {

        if (data) {

            this.title.string = data.title;

            this.content.string = data.content;

            this.Button0.getComponentInChildren(Label).string = data.option0;

            this.Button1.getComponentInChildren(Label).string = data.option1;

            this.callBack = data.callBack;
        }
    }

    onButton0Click() { this.closeView(); }

    onButton1Click() { this.callBack && this.callBack(1); this.closeView(); }

    public static path(): string {

        return "prefab/ui/ShowMessegeBox";
    }
}