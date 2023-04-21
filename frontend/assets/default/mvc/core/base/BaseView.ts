/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-15 22:51:07
 * @LastEditors: guofuyan
 * @Description:视图基类
 */
import ViewEvent from "./ViewEvent";
import {ViewManager} from "../manager/ViewManager";
import UIUtils, { UIContainer } from "../../util/UIUtils";
import { Component, _decorator } from "cc";

const {ccclass, property} = _decorator;

@ccclass
export class BaseView extends Component {

    /** 当前视图的事件对象 */
    private __event__: ViewEvent;
    /** UI节点引用 */
    public ui: UIContainer;

    public __init__(): void {
        this.__event__ = new ViewEvent();
        this.ui = UIUtils.seekAllSubView(this.node);
        this.init();
    }

    /**
     * view 创建时会被调用，子类可以重写.
     */
    public init(): void {

    }

    /**
     * 发送UI事件
     * @param {string} event 事件名称
     * @param {Object} body 事件参数
     */
    public sendEvent(event: string, body?: any): void {
        this.__event__.emit(event, body)
    }

    /**
     * 绑定UI事件
     * @param {string} name 事件名称
     * @param {(body: any)=>void} cb 事件回调
     * @param {BaseMediator} target 事件回调绑定对象
     * @private 私有函数，不得调用。
     */
    public __bindEvent__(name: string, cb: (body: any)=>void, target): void {
        this.__event__.on(name, cb, target);
    }

    /**
     * 关闭当前的界面
     */
    public closeView(): void {
        ViewManager.getInstance().__closeView__(this);
        this.__onClose__();
    }

    /**
     * 关闭所有弹出的界面
     */
    public closeAllPopView(): void {
        ViewManager.getInstance().__closeAllPopView__();
    }

    private __onClose__(): void {
        this.__event__.destroy();
        this.onClose();
        this.node.destroy();
    }

    /**
     * 当界面被关闭时会被调用，子类可以重写该方法。
     * @override
     */
    public onClose(): void {

    }

    /**
     * 子类覆盖，返回UI的prefab路径
     * @return {string}
     */
    public static path(): string {
        return "";
    }
}
