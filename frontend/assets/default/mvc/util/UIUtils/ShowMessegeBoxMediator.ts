/*
 * @Author: guofuyan
 * @Date: 2023-02-27 23:13:00
 * @LastEditTime: 2023-02-28 00:12:05
 * @LastEditors: guofuyan
 * @Description:
 */
import BaseMediator from "../../core/base/BaseMediator";
import ShowMessegeBoxView from "./ShowMessegeBoxView";

export default class ShowMessegeBoxMediator extends BaseMediator {

    public view: ShowMessegeBoxView;

    public init(data?: any): void {

        console.log(data);

        data && this.view.init(data);
    }

    //页面初始化时，调用
    public viewDidAppear(): void {


    }

    //删除时调用
    public destroy(): void {

    }
}