/*
 * @Author: guofuyan
 * @Date: 2023-02-27 22:36:58
 * @LastEditTime: 2023-02-27 23:28:52
 * @LastEditors: guofuyan
 * @Description:
 */
import { _decorator, Component, Node } from 'cc';
import { Facade } from '../../core/Facade';
import ShowMessegeBoxMediator from './ShowMessegeBoxMediator';
import ShowMessegeBoxView from './ShowMessegeBoxView';
const { ccclass, property } = _decorator;

@ccclass('UIAPI')
export class UIAPI {

    private static _instance: UIAPI = new UIAPI();

    public static getInstance(): UIAPI { return this._instance; }

    /**
     * 显示消息确认框
     * @param title 标题
     * @param content 内容
     * @param option1 第一个按钮文字，例如取消
     * @param option2 第二个按钮文字，例如确认
     * @param callBack 回调
     */
    public showMessegeBox(title: string, content: string, option0: string, option1: string, callBack: Function) {

        let param = {

            title: title,
            content: content,
            option0: option0,
            option1: option1,
            callBack: callBack
        }

        Facade.getInstance().popView(ShowMessegeBoxMediator, ShowMessegeBoxView, param);        //弹出一个窗口
    }

    /*  调用方法
    UIAPI.getInstance().showMessegeBox("提示","你是要跳起来吗？","取消","确认",(select)=>{

        console.log(select);
    });
    */
}