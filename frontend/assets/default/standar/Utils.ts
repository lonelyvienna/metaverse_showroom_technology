import { Component, _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export default class UtilsTS extends Component {

    /**
     * 获取地址栏信息
     * @param parama 要获取的字段
     * @returns 数值
     */
    public static getQueryVariable(parama: string): string {

        var query = window.location.search.substring(1);

        // var query = "http://screen.qdmedia.cc/artgallery/?gallery_id=185&wechat_id=1&openid=1234567&nickname=%E6%84%BF%EF%BC%8C%E8%BF%9C&header=https://thirdwx.qlogo.cn/mmopen/vi_32/DYAIOgq83ep6FS6iaWObKov1KdNVblXD1lLSYWHEeqrR2qJlKPSafhhYj8l7lClkpMrFJN7IPiba4kv7OZAQ0agg/132&bg_style=2";
        // var len = query.split("?");
        // query = len[1];
        
        var vars = query.split("&");

        for (var i = 0; i < vars.length; i++) {

            var pair = vars[i].split("=");

            if (pair[0] == parama) { return pair[1]; }
        }

        return null;
    }
}