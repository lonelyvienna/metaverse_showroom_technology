
import { Component, ImageAsset,Node, Sprite, Texture2D, UITransform, _decorator, gfx, Root, SpriteFrame, assetManager, BufferAsset, AssetManager, resources, director, Button, EditBox, Slider, ProgressBar, ToggleContainer, Toggle, Label, EventHandler, SpriteAtlas, size, EventTouch, NodeEventType, tween, Quat, Tween, v3, TypeScript } from "cc";
import { AKPlayerController } from "../akplayer/AKPlayerController";
const { ccclass,property } = _decorator;


@ccclass('SceneAKPlayer')
export class SceneAKPlayer extends Component {
    @property({ type: ToggleContainer})
    public toggle: ToggleContainer = null;
    
    @property({ type: EditBox })
    public inputUrl: EditBox = null;
    public _isStream: boolean = false;

    @property( { type: AKPlayerController})
    public akCtl: AKPlayerController = null;
    
    protected onEnable(): void {
        const containerEventHandler = new EventHandler();
        containerEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
        containerEventHandler.component = 'SceneAKPlayer';// 这个是脚本类名
        containerEventHandler.handler = 'onToggle';
        containerEventHandler.customEventData = '';
        this.toggle?.checkEvents.push(containerEventHandler);
        this.updatePlayerInfo();
    }
    protected onDisable(): void {
        this.toggle.checkEvents = [];

    }
    protected onEditDone(){
        this.updatePlayerInfo();
    }
    protected onToggle(toggle: Toggle, customEventData: string):void {
        console.log(toggle);
        if(toggle.node.name.indexOf('stream')>=0){
            this._isStream = true;
            this.inputUrl.string = "http://www.ffkey.com:8080/live/livestream.flv"

        }else{
            this._isStream = false;
            this.inputUrl.string = "https://demo.ffkey.com/videodemo/videoh264.flv"

        }
        this.updatePlayerInfo();
    }

    protected updatePlayerInfo(){
        this.akCtl.updatePlayerInfo(this.inputUrl.string,this._isStream);
    }
}