/*
 * @Author: guofuyan
 * @Date: 2022-06-16 14:17:22
 * @LastEditTime: 2022-06-16 14:17:43
 * @Description: API接口
 */
import { Component, _decorator } from "cc";
import { Facade } from "../default/mvc/core/Facade";
import PlayerModel, { RuntimeType } from "./model/PlayerModel";

const { ccclass, property } = _decorator;

@ccclass
export default class API extends Component {

    public static debugHost = "http://";     //测试环境

    public static releaseHost = "http://yuan.qdmedia.cc";     //正式环境

    //获取用户信息 
    public static get_user_info = "/api/user/get_user_info";    

    //获取名片列表 
    public static exchange_list = "/api/user/exchange_list";    

    //修改名片信息
    public static user_edit = "/api/user/user_edit";  

    //获取交换名片信息
    public static get_exuser_info = "/api/user/get_exuser_info";  

    //添加名片
    public static add_exuser = "/api/user/add_exuser";  

    public static mergeUrl(url: string): string {

        let host = Facade.getInstance().getModel(PlayerModel).GetGameConfig().runtime == RuntimeType.Release ? API.releaseHost : API.debugHost;

        return host + url;
    }
}
