import { Component, ImageAsset, Node, Sprite, Texture2D, UITransform, _decorator, gfx, Root, SpriteFrame, assetManager, BufferAsset, AssetManager, resources, director, Button, EditBox, Slider, ProgressBar, ToggleContainer, Toggle, Label, EventHandler, SpriteAtlas, size, EventTouch, NodeEventType, tween, Quat, Tween, v3, VideoClip, Asset, loader } from "cc";
import { AKVideoPlayer } from "./AKVideoPlayer";
import { PlayerEvent } from "./Const";

const { ccclass, property, type } = _decorator;

@ccclass('AKPlayerController')
export class AKPlayerController extends Component {

    @property({ type: String })
    public url: string = "";

    @property({ type: Boolean })
    public isStream: boolean = false;

    @property
    private _localFlv: Asset = null;            //视频资源
    @property(Asset)
    get localFlv() {
        return this._localFlv;
    }
    set localFlv(value: Asset) {
        this._localFlv = value;

    }


    @property({ type: Number })
    public delayTime: number = 0.5;

    @property({ type: Button })
    public btnPlay: Button = null;

    @property({ type: Button })
    public btnStop: Button = null;

    @property({ type: Button })
    public btnVolume: Button = null;



    @property({ type: Slider })
    public slider: Slider = null;

    @property({ type: ProgressBar })
    public pb: ProgressBar = null;



    @property({ type: Label })
    public lblTimeline: Label = null;

    @property({ type: Node })
    public nodeLoading: Node = null;

    @property({ type: AKVideoPlayer })
    public videoPlayer: AKVideoPlayer = null;

    @property({ type: SpriteAtlas })
    public atlas: SpriteAtlas = null;

    protected _inited: boolean = false;
    protected _loadingTw: any = null;

    protected onEnable(): void {
        this.btnPlay?.node.on("click", this.onPlay, this);
        this.btnStop?.node.on("click", this.onStop, this);
        this.btnVolume?.node.on("click", this.onMute, this);


        this.videoPlayer.event.on(PlayerEvent.stats, this.onStats, this);
        this.videoPlayer.event.on(PlayerEvent.stop, this.onDone, this);
        this.videoPlayer.event.on(PlayerEvent.play, this.onVideoPlay, this);
        this.videoPlayer.event.on(PlayerEvent.seekingDone, this.onSeekingDone, this);
        this.videoPlayer.event.on(PlayerEvent.buffing, this.onBuffing, this);

        this.slider?.node.on(NodeEventType.TOUCH_END, this.onSliderTo, this);
        this.slider?.handle.node.on(NodeEventType.TOUCH_END, this.onSliderTo, this);
        this.slider?.node.on(NodeEventType.TOUCH_CANCEL, this.onSliderTo, this);
        this.slider?.handle.node.on(NodeEventType.TOUCH_CANCEL, this.onSliderTo, this);
        this._initView();


    }
    protected onDisable(): void {
        this.btnPlay?.node.off("click", this.onPlay, this);
        this.btnStop?.node.off("click", this.onStop, this);
        this.btnVolume?.node.off("click", this.onMute, this);

        this.videoPlayer.event.off(PlayerEvent.stats, this.onStats, this);
        this.videoPlayer.event.off(PlayerEvent.stop, this.onDone, this);
        this.videoPlayer.event.off(PlayerEvent.play, this.onVideoPlay, this);
        this.videoPlayer.event.off(PlayerEvent.seekingDone, this.onSeekingDone, this);
        this.videoPlayer.event.off(PlayerEvent.buffing, this.onBuffing, this);

        this.slider?.node.off(NodeEventType.TOUCH_END, this.onSliderTo, this);
        this.slider?.handle.node.off(NodeEventType.TOUCH_END, this.onSliderTo, this);
        this.slider?.node.off(NodeEventType.TOUCH_CANCEL, this.onSliderTo, this);
        this.slider?.handle.node.off(NodeEventType.TOUCH_CANCEL, this.onSliderTo, this);


    }

    onVideoPlay(): void {
        if (this.videoPlayer.quieting) {
            this.changeTexture(this.btnVolume, "volume_off");
        } else {
            this.changeTexture(this.btnVolume, "volume_on");
        }
        this.changeTexture(this.btnStop, "stop");
        this.onStopLoading();
    }
    onDone(): void {
        this._initView();

        this.scheduleOnce(() => { this.play(this.url, this.isStream); }, 1);
    }
    onStats(stats: any): void {
        console.log(stats);
        if (this.pb && this.slider) {
            this.pb.progress = stats.ts / Math.max(stats.ts, stats.duration);
            this.slider.progress = this.pb.progress;
        }
        if (this.lblTimeline) this.lblTimeline.string = this.formatTime(stats.ts / 1000) + '/' + this.formatTime(stats.duration / 1000);
    }

    formatTime(s): string {
        var h = Math.floor(s / 3600) < 10 ? '0' + Math.floor(s / 3600) : Math.floor(s / 3600);
        var m = Math.floor((s / 60 % 60)) < 10 ? '0' + Math.floor((s / 60 % 60)) : Math.floor((s / 60 % 60));
        var ss = Math.floor((s % 60)) < 10 ? '0' + Math.floor((s % 60)) : Math.floor((s % 60));
        let result = h + ":" + m + ":" + ss;
        return result;
    }
    protected onBuffing(value: boolean) {
        if (value) {
            this.onStartLoading();
        } else {
            this.onStopLoading();
        }
    }
    protected onSeekingDone() {
        this.onStopLoading();
    }
    protected onSliderTo(e: EventTouch) {
        let value = (this.pb && this.slider) ? this.slider.progress : 0;
        this.seek(value);
    }

    public updatePlayerInfo(url: string, isStream: boolean = false) {
        this.isStream = isStream;
        this.url = url;
    }
    public hasAudio(v: boolean) {
        if (this.videoPlayer) {
            this.videoPlayer.hasAudio(v);
        }
    }
    protected onSlider(silder: Slider) {

        if (this.pb && this.slider) this.pb.progress = this.slider.progress;

    }
    public onStartLoading() {
        if (!this.nodeLoading) return;
        if (this._loadingTw) {
            this.onStopLoading();
        }
        this.nodeLoading.active = true;
        this._loadingTw = tween(this.nodeLoading).by(1, { eulerAngles: v3(0, 0, 360) }).repeat(1000).start();
    }
    public onStopLoading() {
        if (this._loadingTw) {
            this._loadingTw.stop();
            this.nodeLoading.active = false;
            this._loadingTw = null;
        }
    }
    protected onPlay(): void {
        this.play(this.url, this.isStream)
    }
    public setBufferTime(bufferTime: number) {
        this.videoPlayer.setBufferTime(bufferTime);
    }
    protected changeTexture(btn: Button, texName: string): void {
        if (!btn) {
            return;
        }
        btn.getComponent(Sprite).spriteFrame = this.atlas.getSpriteFrame(texName);
    }
    protected _initView(): void {
        this.changeTexture(this.btnPlay, "play");
        if (this.pb) this.pb.progress = 0;
        if (this.slider) this.slider.progress = 0;
        this._inited = false;
        this.changeTexture(this.btnStop, "stop_off");
        this.changeTexture(this.btnVolume, "volume_off");
        if (this.lblTimeline) this.lblTimeline.string = "00:00:00/00:00:00";
        this.onStopLoading();
    }
    protected onStop(): void {
        this.stop();
    }

    protected onMute(): void {
        let result = this.videoPlayer.quieting;
        this.setMute(!result);
    }

    //开放函数调用
    public play(url: string, isStream: boolean) {
        if (this._localFlv) {
            let localUrl = this._localFlv.nativeUrl;

            if (localUrl && loader.md5Pipe) {
                localUrl = loader.md5Pipe.transformURL(localUrl);

            }
            this.url = window.location.href + localUrl;
            isStream = false;
        }

        if (!this._inited) {
            this.videoPlayer.play(this.url, this.isStream);

            this._inited = true;
            this.onStartLoading();
            this.changeTexture(this.btnPlay, "pause");

        } else {
            this.pause(this.videoPlayer.playing);
        }
    }
    public pause(value: boolean) {
        if (!this._inited || value != this.videoPlayer.playing) {
            return;
        }
        if (value) {
            this.videoPlayer.pause();
            this.changeTexture(this.btnPlay, "play");
        } else {
            this.videoPlayer.resume();
            console.log("XXXXXXXXXXXX");
            
            this.changeTexture(this.btnPlay, "pause");
        }
    }
    public stop() {
        this._initView();
        this.videoPlayer.close();
    }
    public seek(value: number) {
        if (this.videoPlayer.hasPlayed) {
            this.videoPlayer.seekTo(value);
            this.onStartLoading();
        } else {
            if (this.pb && this.slider) this.slider.progress = this.pb.progress = 0;
        }
    }
    public setMute(value: boolean) {
        this.videoPlayer.quieting = value;
        this.changeTexture(this.btnVolume, this.videoPlayer.quieting ? "volume_off" : "volume_on");
    }

    public setVolume(value: boolean) {
        //todo
    }

}
