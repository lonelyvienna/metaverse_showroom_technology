/*
 * @Author: guofuyan
 * @Date: 2022-06-16 14:18:17
 * @LastEditTime: 2022-06-16 22:36:30
 * @Description: UI效果
 */
import { assetManager, Color, Component, error, Sprite, SpriteFrame, Texture2D, tween, Widget, _decorator, Node, UIOpacity, ImageAsset } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class UIEffectHelper extends Component {

    /**
     * 淡入或淡出
     * 该脚本会自动在Page最下面创建一个黑色面板，用于临时蒙版使用
     * @param pageNode 传入需要操作的Page
     * @param isIn 是否是淡入，默认是淡入
     * @param callback 动画结束回调
     */
    public static fade(pageNode: Node, isIn: boolean = true, callback: () => void = null) {

        let self = this;

        //创建黑色蒙版节点
        let newNode = new Node();

        pageNode.addChild(newNode);      //添加到Page节点下

        newNode.layer = pageNode.layer;     //放在UI层级

        let blackPanelOpacity = newNode.addComponent(UIOpacity);     //透明度调节

        //创建黑色贴图
        const base = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAA1BMVEX///+nxBvIAAAACklEQVQI12MAAgAABAABINItbwAAAABJRU5ErkJggg==';

        let img = new Image();

        const tex = new Texture2D();

        img.onload = function () {

            tex.reset({

                width: img.width,

                height: img.height,

            });

            tex.uploadData(img, 0, 0);

            tex.loaded = true;

            const sp = new SpriteFrame();

            sp.texture = tex;

            newNode.addComponent(Sprite).spriteFrame = sp;

            newNode.getComponent(Sprite).color = Color.BLACK;

            newNode.setSiblingIndex(1000);       //放在最下面

            //设置蒙版全屏
            let widget = newNode.addComponent(Widget);

            widget.isAlignLeft = widget.isAlignRight = widget.isAlignTop = widget.isAlignBottom = true;

            widget.left = widget.right = widget.top = widget.bottom = 0;

            widget.updateAlignment();

            //淡入或淡出动画
            let startNum = 0, endNum = 255;

            if (isIn) {

                startNum = 255;
                endNum = 0;
            }

            blackPanelOpacity.opacity = startNum;

            tween(blackPanelOpacity)
                .to(0.2, { opacity: endNum })
                .call(() => {

                    newNode.destroy();

                    if (callback != null) {

                        callback();
                    }
                })
                .start()
        };

        img.src = base;
    }
}
