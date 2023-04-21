/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-16 00:31:47
 * @LastEditors: guofuyan
 * @Description:
 */

import { resources } from "cc";
import BaseLoader from "./BaseLoader";

export default class TextLoader extends BaseLoader {

    public loadNetRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // TODO 加载网络文本资源
        throw new Error("TextLoader loadNetRes method not implemented.");
    }

    public loadRemoteRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // TODO 加载远程待下载文本资源
        throw new Error("TextLoader loadRemoteRes method not implemented.");
    }

    public loadLocalRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        resources.load(path, type, callback);
    }
}
