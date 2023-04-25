import { Component, ImageAsset,Node, Sprite, Texture2D, UITransform, _decorator, gfx, Root, SpriteFrame, assetManager, BufferAsset, AssetManager, resources, director, Label, EventTarget, Material, size, MeshRenderer } from "cc";
import { ThreadWorker } from "./ThreadWorker";
import { AKAudio } from "./AKAudio";
import { ePlayerTexture, PlayerBufferStatus, PlayerCmdType, PlayerEvent, PlayerPostMessage } from "./Const";
import { Options } from "./Options";
import { PlatformUtils } from "./PlatformUtils";
import { AKDecoder } from "./AKDecoder";


const { ccclass, property, type } = _decorator;

@ccclass('AKVideoPlayer')
export class AKVideoPlayer extends Component  {
    
    decodeWorker : ThreadWorker |AKDecoder = null;
    _opt: Options = null;
    _audioPlayer: AKAudio = null;
    _hasLoaded:boolean = false;
    _event: EventTarget = null;
    _playUrl: string = null;
    hasPlayed: boolean = false;
    videoWidth: number = 0;
    videoHeight: number = 0;
    fileSize:number = 0;
    _isStream: boolean = false;
    _playing:boolean = false;
    _fullscreen:boolean = false;
    _startBpsTime:number = 0;
    _bps:number = 0;
    _videoFrameBuffer = [];
    _audioFrameBuffer = [];
    _videoFormat = ePlayerTexture.kVideoRGB;
    _lastVideoPts:number = 0;
    useWorker:boolean = false;
    _stats = {
        buf: 0, //ms
        fps: 0,
        abps: '',
        vbps: '',
        ts: 0,
        duration:0,
    }
 

    private _texture0: Texture2D = new Texture2D();     //通道0
    private _texture1: Texture2D = new Texture2D();     //通道1
    private _texture2: Texture2D = new Texture2D();     //通道2

    @property({ type: Sprite })
    public render2D: Sprite = null;

    @property({ type: MeshRenderer })
    public render3D: MeshRenderer = null;

    @property({ type: Material})
    public yuvMat: Material = null;
    @property({ type: Material})
    public rgbMat: Material = null;

    public render: Sprite | MeshRenderer = null;

    public get videoFormat() {
        return this._videoFormat;
    }

    public set videoFormat(v){
        this._videoFormat = v;
       
    }

    start() {
        this._opt = new Options();
        if(this.render2D){
            this.render = this.render2D;
        }else{
            this.render = this.render3D;
        }
        this.schedule(()=>this.displayVideoLoop(),25/1000);
    }

    /**
     * 设置最大缓冲时长，单位秒，播放器会自动消除延迟
     * @param buffer 单位 秒
     */
    setBufferTime(buffer) {
        buffer = Number(buffer)
        this.decodeWorker.postMessage({
            cmd: PlayerPostMessage.setVideoBuffer,
            time: buffer
        })
    }
    onLoad(){

    }
    renderYUVFrame (y,u,v, ts) {
        if(this.videoFormat == ePlayerTexture.kVideoYUV){
        
            this._texture0.uploadData(new Uint8Array(y));
            this._texture1.uploadData(new Uint8Array(u));
            this._texture2.uploadData(new Uint8Array(v));
        }
        
        this.render.getMaterial(0).passes[0].update();
    
    }

    renderRGBFrame (data, ts) {
        this._texture0.uploadData(new Uint8Array(data));
        this.render.getMaterial(0).passes[0].update();
    
    }
    /**
         * 更新材质
         */
    protected _updateMaterial(): void {
        let material = this.render.getMaterial(0);
        if (material) {
            material.setProperty('texture0', this._texture0);
            if(this.videoFormat == ePlayerTexture.kVideoYUV){
                material.setProperty('texture1', this._texture1);
                material.setProperty('texture2', this._texture2);
            }
           
        }

       
    }

    public get event():EventTarget {
        if(!this._event){
            this._event = new EventTarget();
        }
        return this._event;
    }

    /**
   * 重置贴图状态
   * @param texture 贴图
   * @param width 宽
   * @param height 高
   */
    private _resetTexture(texture: Texture2D, width: number, height: number, format?: number) {
        texture.setFilters(Texture2D.Filter.LINEAR, Texture2D.Filter.LINEAR);
        texture.setMipFilter(Texture2D.Filter.LINEAR);
        texture.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);


        texture.reset({
            width: width,
            height: height,
            //@ts-ignore
            format:  this.videoFormat == ePlayerTexture.kVideoYUV ?gfx.Format.R8: gfx.Format.RGB8
        });
    }

    /**
     * 更新贴图
     */
    private _updateTexture() {
        if (this.render instanceof Sprite) {
            let sprite: Sprite = this.render;
            if (sprite.spriteFrame === null) {
                sprite.spriteFrame = new SpriteFrame();
            }
            let texture = new Texture2D();
            this._resetTexture(texture, this.videoWidth, this.videoHeight);
            sprite.spriteFrame.texture = texture;
        }
        this._resetTexture(this._texture0, this.videoWidth, this.videoHeight);
        let material = this.render.material;
        material?.setProperty('texture0', this._texture0);
        if(this.videoFormat == ePlayerTexture.kVideoYUV){
            this._resetTexture(this._texture1, this.videoWidth >> 1, this.videoHeight >> 1);
            material?.setProperty('texture1', this._texture1);
            this._resetTexture(this._texture2, this.videoWidth >> 1, this.videoHeight >> 1);
            material?.setProperty('texture2', this._texture2);
        }
        
    }


    set playing(value) {

        if (this._playing !== value) {
            if (value) {
                this.event.emit(PlayerEvent.resume);
                this.decodeWorker.postMessage({cmd: PlayerPostMessage.resume})
            } else {
                this.event.emit(PlayerEvent.pause);
                this.decodeWorker.postMessage({cmd: PlayerPostMessage.pause})
            }
        }
        this._playing = value;
    }
   
    pause(){
        
        this.playing = false;
    }
    resume(){
        this.playing = true;
    }
   
    get playing() {
        return this._playing;
    }

    set quieting(value:boolean) {
       
        if (this._audioPlayer.quieting !== value) {
            if(value){
                this._audioPlayer.mute();
            }else{
                this._audioPlayer.cancelMute();
            }
            this.event.emit(PlayerEvent.mute, value);
        }
        
    }

    get quieting() {
        return this._audioPlayer.quieting;
    }


    close() {
        this.playing = false;
        this._videoFrameBuffer = [];
        this._audioFrameBuffer = [];
        if(this._audioPlayer){
            this._audioPlayer.closeAudio();
            this._audioPlayer = null;
        }
        if(this.decodeWorker){
            this.decodeWorker.postMessage({cmd: PlayerPostMessage.close})
            this.decodeWorker.terminate();
            this.decodeWorker = null;
        }
        this._initCheckVariable();
        
        this.event.emit(PlayerEvent.stop);
    }



    _initCheckVariable() {
        this._startBpsTime = 0;
        this._bps = 0;
        
    }



    play(url:string, isStream:boolean = false){
        if (!this._playUrl && !url) {
            return;
        }
        let needDelay = false;
        if (url) {
            if (this._playUrl) {
                this.close();
                needDelay = true;
               
            }
         
            this._playUrl = url;
        }
        this._initCheckVariable();

        if (needDelay) {
            setTimeout(() => {
               this.startPlay(this._playUrl,isStream);
            }, 300);
        } else {
            this.startPlay(this._playUrl,isStream);
        }
    }
    startPlay(url:string,isStream:boolean = false){
        this._isStream = isStream;
       
        this._audioPlayer = new AKAudio();
        this._audioPlayer.init();
        this.initDecodeWorker();
        
       
    }
    initDecodeWorker() {
       let cb = (v) =>{
        this.decodeWorker = v;
        v.onRecv = (res,data) => {
            //@ts-ignore
            const msg = data;
           
            switch (msg.cmd) {
                case PlayerCmdType.init:
                   
                    this._opt.debug && console.log('_init');
                    this.setBufferTime(this._opt.videoBuffer);
                    this.decodeWorker.postMessage({
                        cmd: PlayerPostMessage.init,
                        opt: JSON.stringify(this._opt),
                        sampleRate: this._audioPlayer.sampleRate(),
                        video: this.videoFormat,
                    })
                    if (!this._hasLoaded) {
                        this._hasLoaded = true;
                        this.onLoad();
                         this.event.emit(PlayerEvent.load);
                    }
                    if(this._isStream){
                        this.decodeWorker.postMessage({cmd: PlayerPostMessage.play, url: this._playUrl})
                    }else{
                        this.decodeWorker.postMessage({cmd: PlayerPostMessage.fileInfo, url: this._playUrl})
                    }
                    break;
                case PlayerCmdType.initSize:
                    console.log('[decodeWorker]PlayerCmdType.initSize, start playing');
                    this._opt.debug && console.log('_initSize');
                    this.videoWidth = msg.w;
                    this.videoHeight = msg.h;
                    this.onInitSize();
                    this.event.emit(PlayerEvent.videoInfo, {w: msg.w, h: msg.h});
                    this.event.emit(PlayerEvent.start);
                   
                   break;
                case PlayerCmdType.renderRGB:{
                    // console.log('[decodeWorker]PlayerCmdType.renderRGB');
                    
                    this.hasPlayed = true;
                    this.bufferedVideoFrame(msg);
                   

                    this.event.emit(PlayerEvent.timeUpdate, msg.ts);
                 
                    this._updateStats({buf: msg.delay, ts: msg.ts},false,true);
                
                    break;
                   
                }
                case PlayerCmdType.audioCodec:{
                    console.log(msg);
                    break;
                }
                case PlayerCmdType.render:
                  //  console.log('[decodeWorker]PlayerCmdType.render');
                   
                    this.hasPlayed = true;
                   this.bufferedVideoFrame(msg);
                 
                    this.event.emit(PlayerEvent.timeUpdate, msg.ts);
                   
                    this._updateStats({buf: msg.delay, ts: msg.ts},false,true);
              
                    break;
                case PlayerCmdType.playAudio:
                    this.hasPlayed = true;
                   // console.log('[decodeWorker]PlayerCmdType.playAudio');
                    this.bufferedAudioFrame(msg)    
                    this._updateStats({ts:msg.ts});
                       
                    
                    break
                case PlayerCmdType.print:
                    // this.onLog(msg.text);
                    this.event.emit(PlayerEvent.log, msg.text);
                    break;
                case PlayerCmdType.printErr:
                    // this.onLog(msg.text);
                    this.event.emit(PlayerEvent.log, msg.text);
                    // this.onError(msg.text);
                    this.event.emit(PlayerEvent.error, msg.text);
                    // // 跨域报错，就直接返回错误。
                    // if (msg.text === 'Failed to fetch') {
                    //     this._reset();
                    // }
                    break;
                case PlayerCmdType.initAudio:
                    console.log('[decodeWorker]PlayerCmdType.initAudio, trigger audio info',msg);
                    this._audioPlayer.initAudio(msg);
                    this.event.emit(PlayerEvent.audioInfo, {
                        numOfChannels: msg.channels, // 声频通道
                        sampleRate: msg.samplerate // 采样率
                    });
                    if(this._opt.audioOnly){
                        // console.log('[decodeWorker]PlayerCmdType.initAudio, audio only mode, start playing');
                        
                        
                    }
                    this.event.emit(PlayerEvent.start);
                    this.event.emit(PlayerEvent.play);
                    break;
                case PlayerCmdType.kBps:
                    if (this.playing) {
                        this.event.emit(PlayerEvent.kBps, msg.kBps);
                    }
                    break;
                case PlayerCmdType.duration:{
                    console.log("duration:",msg.duration);
                    this._stats.duration = msg.duration;
                    break;
                }
                case PlayerCmdType.playDone: {
                    console.log("playDone");
                    this._updateStats({},true);
                    this.close();
                    break;
                }
                case PlayerCmdType.fileSize:{
                    console.log("getFileSize",msg);
                    if(+msg.status == 200 || +msg.status == 304){
                        this.fileSize = +msg.fileSize;
                        this.decodeWorker.postMessage({cmd: PlayerPostMessage.play, url: this._playUrl,fileSize:this.fileSize})
                    }
                    
                    break;
                }
                case PlayerCmdType.seekingDone:{
                    this.event.emit(PlayerEvent.seekingDone);
                    this._audioPlayer.updatePTS(msg.ts);
                    this._lastVideoPts = msg.ts;
                    this._audioFrameBuffer = [];
                    this._videoFrameBuffer = [];
                    break;
                }
                default:
                   // this[msg.cmd] && this[msg.cmd](msg);
            }
           
        }
        v.init();
        
       }
       if(this.useWorker){
            ThreadWorker.asyncCreate(PlatformUtils.isWX?null:"akdecoder",PlatformUtils.isWX?"worker/akdecoder.js":null).then(cb)
       }else{
            AKDecoder.asyncCreate().then(cb);
       }
    }
    bufferedAudioFrame(msg){
        this._audioFrameBuffer.push(msg);

    }
    bufferedVideoFrame(msg){
        const audioTs = this._audioPlayer.getTimestamp();
        // if(msg.ts < audioTs - 500){
        //     return;
        // }
        this._videoFrameBuffer.push(msg);
        
    }

    displayVideoLoop(){
        if (this._videoFrameBuffer.length) {
            var audioTs = this._audioPlayer.getTimestamp();
            var audioOffset = audioTs;
            if(this._audioFrameBuffer.length){
              audioOffset = Math.max(this._audioFrameBuffer[0].ts,audioTs);
            } 
          //  console.log("audioTs",audioTs,"video0",this._videoFrameBuffer[0].ts,this._videoFrameBuffer[0].ts <= audioOffset);
            if (this._audioPlayer.quieting || this._videoFrameBuffer[0].ts <= audioOffset) {
              if (this._videoFrameBuffer[0].ts < audioTs - 400) {
                this._videoFrameBuffer.shift();
              }

              if (this._videoFrameBuffer.length) {
            //   console.log("renderVideo")
                this.renderVideoFrame(this._videoFrameBuffer.shift());
              }
            }
        }

        if (this._audioFrameBuffer.length) {
           // console.log("audioTs2",this._audioFrameBuffer[0].ts,"lastVideo",this._lastVideoPts)
            let offset = this._lastVideoPts;
            if(this._videoFrameBuffer.length){
                offset = Math.max(offset,this._videoFrameBuffer[0].ts);
            }
            if (this._audioFrameBuffer[0].ts - offset < 300) {
           //     console.log("renderAudio")
                this._audioPlayer.playAudio(this._audioFrameBuffer.shift());
            }
        }
    }
    
    renderVideoFrame(msg){
        this._lastVideoPts = msg.ts;
        if(this.videoFormat == ePlayerTexture.kVideoYUV){
            this.renderYUVFrame(msg.y,msg.u,msg.v,msg.ts);
        }else{
            this.renderRGBFrame(msg.rgb,msg.ts)
        }
    }
    onInitSize(){

        if(this.videoFormat == ePlayerTexture.kVideoYUV){
            this.render.setMaterial(this.yuvMat,0);
        }else{
            this.render.setMaterial(this.rgbMat,0);
        }
        this._updateTexture();
        if (this.render instanceof Sprite) {
            let maxWidth = this.node.getComponent(UITransform).width;
            let radio =  this.videoWidth / maxWidth;
            let fixedHeight = this.videoHeight / radio;
            this.render.getComponent(UITransform).setContentSize(size(maxWidth,fixedHeight));
        }
    }
    

    now(): number {
        return new Date().getTime();
    }
    
    _updateStats(options,force:boolean=false,isFromVF:boolean=false) {
        options = options || {};

        if (!this._startBpsTime) {
            this._startBpsTime = this.now();
        }
        const _nowTime = this.now();
        const timestamp = _nowTime - this._startBpsTime;

        
        if(options.ts) this._stats.ts = this._audioPlayer.getTimestamp(); //options.ts;
        if(isFromVF && timestamp < 1 * 1000){
            this._stats.fps += 1;
        }
        if (!force && timestamp < 1 * 1000 ) {
            return;
        }
        if(options.buf) this._stats.buf = options.buf;
        this.event.emit(PlayerEvent.stats, this._stats);
        this.event.emit(PlayerEvent.performance, this.fpsStatus(this._stats.fps));
        this.event.emit(PlayerEvent.buffer, this.bufferStatus(this._stats.buf, this._opt.videoBuffer * 1000));
        this._stats.fps = 0;
        this._startBpsTime = _nowTime;
    }
    bufferStatus(buffer, settingBuffer) {
        let result = PlayerBufferStatus.buffering;
        if (buffer === 0) {
            result = PlayerBufferStatus.empty
        } else if (buffer >= settingBuffer) {
            result = PlayerBufferStatus.full;
        }
        return result;
    }
    bpsSize(value) {
        if (null == value || value === '') {
            return "0 KB/S";
        }
        let size = parseFloat(value);
        return `${size.toFixed(2)}KB/S`;
    }
    
    seekTo(precent) {
        let pts = this._stats.duration * precent;
        let start = this.fileSize * precent;
        this.decodeWorker.postMessage({cmd: PlayerPostMessage.seekTo, pts: pts, start: start})
        this._audioFrameBuffer = [];
        this._videoFrameBuffer = [];
    }
    fpsStatus(fps) {
        let result = 0;
        if (fps >= 24) {
            result = 2;
        } else if (fps >= 15) {
            result = 1;
        }
    
        return result;
    }
   
    onPlayClick(){
        this.decodeWorker.postMessage({cmd: PlayerPostMessage.play, url:"http://127.0.0.1/video/1.flv"}); //url:"http://192.168.1.178:8088/live/livestream.flv"});  // url: "http://192.168.1.191/video/1.flv"})
        this._audioPlayer.cancelMute();
    }
}