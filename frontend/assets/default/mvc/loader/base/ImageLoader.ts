/*
 * @Author: guofuyan
 * @Date: 2022-06-15 22:30:55
 * @LastEditTime: 2022-06-16 00:31:16
 * @LastEditors: guofuyan
 * @Description:
 */

import { assetManager, ImageAsset, resources, SpriteFrame, Texture2D } from "cc";
import BaseLoader from "./BaseLoader";

export default class ImageLoader extends BaseLoader {

    public loadNetRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // 加载网络图片资源
        assetManager.loadRemote<ImageAsset>(path, { ext: '.png' }, (e, tex) => {

            if (e) {

                console.log(e);
            }

            if (callback) {

                const spriteFrame = new SpriteFrame();

                const texture = new Texture2D();

                texture.image = tex;

                spriteFrame.texture = texture;

                callback(e, spriteFrame);
            }
        });
    }

    public loadRemoteRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        // TODO 加载远程待下载图片资源
        throw new Error("ImageLoader loadRemoteRes method not implemented.");
    }

    public loadLocalRes(path: string, type: any, callback: (err: any, res: any) => void): void {
        resources.load(path, type, callback);
    }
}
