import {ViewManager} from "./manager/ViewManager";
import BaseMediator from "./base/BaseMediator";
import BaseScene from "./base/BaseScene";
import {BaseView} from "./base/BaseView";
import {OPEN_VIEW_OPTION} from "./Constants";
import BaseCommand from "./base/BaseCommand";
import CommandManager from "./manager/CommandManager";
import ModelManager from "./manager/ModelManager";
import BaseModel from "./base/BaseModel";
import NotificationManager from "./manager/NotificationManager";
import FrameworkCfg from "./FrameworkCfg";
import { Size } from "cc";

export class Facade {
    /** 实例对象 */
    private static _instance: Facade = new Facade();
    /** 框架是否被初始化 */
    private static _isInit: boolean = false;

    private constructor () {

    }

    public static getInstance(): Facade {
        return this._instance;
    }

    /**
     * 初始化框架配置
     * @param {boolean} debug 是否是调试状态
     * @param {cc.Size} designResolution 设计分辨率
     * @param {boolean} fitHeight 是否高适配
     * @param {boolean} fitWidth 是否宽适配
     */
    public init(debug: boolean, designResolution: Size, fitHeight: boolean, fitWidth: boolean): void {
        if (Facade._isInit) {
            console.warn("框架已经初始化，不需要重复初始化。");
            return;
        }
        Facade._isInit = true;
        FrameworkCfg.DEBUG = debug;
        FrameworkCfg.DESIGN_RESOLUTION = designResolution;
        FrameworkCfg.FIT_HEIGHT = fitHeight;
        FrameworkCfg.FIT_WIDTH = fitWidth;
    }

    /**
     * 运行场景
     * @param {{new(): BaseMediator}} mediator 场景mediator类型，类类型。
     * @param {{new(): BaseScene}} view 场景mediator类型，类类型。
     * @param {Object} data 自定义的任意类型透传数据。（可选）
     * @param {()=>void} cb 加载完成回调.
     */
    public runScene(mediator: {new(): BaseMediator}, view: {new(): BaseScene}, data?: any, cb?: ()=>void): void {
        if (Facade._isInit) {
            ViewManager.getInstance().__runScene__(mediator, view, data, cb);
        } else {
            console.warn("框架没有初始化，请先调用init接口进行初始化。");
        }
    }

    /**
     * 返回上一场景
     * @returns {boolean}是否存在上一个场景
     */
    public backScene(): boolean {
        return ViewManager.getInstance().__backScene__();
    }

    /**
     * 打开view界面，弹出界面
     * @param {{new(): BaseMediator}} mediator 界面mediator类型，类类型。
     * @param {{new(): BaseView}} view view 场景mediator类型，类类型。
     * @param {Object} data 自定义的任意类型透传数据。（可选）
     * @param {()=>void} cb 加载完成回调.
     */
    public popView(mediator: {new(): BaseMediator}, view: {new(): BaseView}, data?: any, cb?: ()=>void): void {
        ViewManager.getInstance().__showView__(mediator, view, data, OPEN_VIEW_OPTION.OVERLAY, 0, cb);
    }

    /**
     * 打开view界面，弹出界面
     * @param {{new(): BaseMediator}} mediator 界面mediator类型，类类型。
     * @param {{new(): BaseView}} view view 场景mediator类型，类类型。
     * @param {Object} data 自定义的任意类型透传数据。（可选）
     * @param {()=>void} cb 加载完成回调.
     */
    public openView(mediator: {new(): BaseMediator}, view: {new(): BaseView}, data?: any, cb?: ()=>void): void {
        ViewManager.getInstance().__showView__(mediator, view, data, OPEN_VIEW_OPTION.SINGLE, 0, cb);
    }

    /**
     * 创建view层，此接口用于初始不会被关闭和再次打开的常驻界面，所以它也不会受到pooView影响和管理。
     * @param {{new(): BaseMediator}} mediator 界面mediator类型，类类型。
     * @param {{new(): BaseView}} view view 场景mediator类型，类类型。
     * @param {number} zOrder ui层级
     * @param {Object} data 自定义的任意类型透传数据。（可选）
     * @param {()=>void} cb 加载完成回调.
     */
    public addLayer(mediator: {new(): BaseMediator}, view: {new(): BaseView}, zOrder?: number, data?: any, cb?: ()=>void): void {
        ViewManager.getInstance().__showView__(mediator, view, data, OPEN_VIEW_OPTION.LAYER, zOrder, cb);
    }

    /**
     * 撤销命令
     * @param {{new (): BaseCommand}} command 命令对象
     * @param {Object} body 命令参数
     */
    public __undoCommand__(command: {new (): BaseCommand}, body?: any): void {
        CommandManager.getInstance().__undoCommand__(command, body);
    }

    /**
     * 注册数据model
     * @param {{new (): BaseModel}} model
     */
    public registerModel(model: {new (): BaseModel}): void {
        ModelManager.getInstance().registerModel(model);
    }

    /**
     * 获取model对象
     * @param {{new (): BaseModel}} model
     */
    public getModel<T extends BaseModel>(model: {new (): T}): T {
        return ModelManager.getInstance().getModel(model);
    }
}

/** 导入到全局属性mvc中的对外接口和属性等api */
(<any>(window)).mvc = {
    appFacade: Facade.getInstance(),
};

