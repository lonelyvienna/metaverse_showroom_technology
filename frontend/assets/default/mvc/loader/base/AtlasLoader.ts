/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-15 23:01:55
 * @LastEditors: guofuyan
 * @Description:
 */

import { resources } from "cc";
import BaseLoader from "./BaseLoader";

export default class AtlasLoader extends BaseLoader {

    public loadNetRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // TODO 加载网络图集资源
        throw new Error("AtlasLoader loadNetRes method not implemented.");
    }

    public loadRemoteRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // TODO 加载远程待下载图集资源
        throw new Error("AtlasLoader loadRemoteRes method not implemented.");
    }

    public loadLocalRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        resources.load(path, type, callback);
    }

}
