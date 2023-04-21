//import { SoundTouch,SimpleFilter } from '../../libs/soundtouch.mjs';

import { PlatformUtils } from "./PlatformUtils";

const BUFFER_SIZE = 4096;

export class AKAudio {
  
    _audioContext = null;
    _gainNode = null;
    _scriptNode = null;
    quieting:boolean = false;
    _audioPlayBuffers = [];
  //  soundTouch:SoundTouch = null;
  //  simpleFilter:SimpleFilter = null;
    samples:Float32Array = null;
    source: any = null;
    pts:number = 0;

    audioContextUnlock(context) {
        // context.resume();
        // const source = context.createBufferSource();
        // source.buffer = context.createBuffer(1, 1, 22050);
        // source.connect(context.destination);
        // if (source.noteOn)
        //     source.noteOn(0);
        // else
        //     source.start(0);
    }
    
    audioEnabled(flag){
        if (flag) {
           // this.audioContextUnlock(this._audioContext)
            this._audioContext.resume();
        } else {
            // suspend
            this._audioContext.suspend();
           
        }
    }
    
    init(){
        //fixed ios or safari
        this.audioContext.suspend();
        this.audioContext.resume();
    }
    mute() {
        this.audioEnabled(false);
        this.quieting = true;
    }
    //
    cancelMute() {
        this.audioEnabled(true);
        this.quieting = false;
    }
  
    sampleRate(){
        return this.audioContext.sampleRate;
    }
    public get audioContext(){
        if(!this._audioContext){
            if(PlatformUtils.isWX){
                //@ts-ignore
                this._audioContext =  wx.createWebAudioContext();
            }else{
                //@ts-ignore
                this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            this._gainNode = this._audioContext.createGain();
        }
        return this._audioContext;
    }

    initAudio(msg){

        const context = this._audioContext;
        if (!context) return false;

        
        this._audioPlayBuffers = [];
        
     //   this.soundTouch = new SoundTouch()
     //   this.soundTouch.tempo = 0.5;
     //   this.soundTouch.pitch = 2.0;
      //  this.soundTouch.rate = 1.0;
        this.samples = new Float32Array(BUFFER_SIZE * 2);
        this.pts = 0;
        this._scriptNode = context.createScriptProcessor(BUFFER_SIZE, 0, 2);
        let nextFixedZero = false;
        this._scriptNode.onaudioprocess =  (audioProcessingEvent) => {
            if (this._audioPlayBuffers.length) {
                const buffer = this._audioPlayBuffers.shift()
                for (let channel = 0; channel < msg.channels; channel++) {
                    const b = buffer[channel]
                    const nowBuffering = audioProcessingEvent.outputBuffer.getChannelData(channel);
                    for (let i = 0; i < 4096; i++) {
                        nowBuffering[i] = b[i];
                    }
                }
                nextFixedZero = true;
            }else if(nextFixedZero) {
                nextFixedZero = false;
                for (let channel = 0; channel < msg.channels; channel++) {
                    const nowBuffering = audioProcessingEvent.outputBuffer.getChannelData(channel);
                    for (let i = 0; i < BUFFER_SIZE; i++) {
                        nowBuffering[i] = 0;
                    }
                }
            }
           
            
        };
        this._scriptNode.connect(this._gainNode);
        this._gainNode.connect(context.destination);
        
        
    }


    playAudio(msg) {
        this.pts = msg.ts;
        
        
        if(this.quieting){
            return;
        }
        if(this._audioContext.state == 'suspended' || this._audioContext.state == 'interrupted'){
            this.audioEnabled(true);
        }
        let out = [];
        if(msg.buffer0) out.push(new Float32Array(msg.buffer0));
        if(msg.buffer1) out.push(new Float32Array(msg.buffer1));
        this._audioPlayBuffers.push(out);
       

    }

    createExtractFn(buffer) {
        return ({
          extract: (target, numFrames, position) => {
            const l = buffer.getChannelData(0);
            const r = buffer.getChannelData(1);
            for (let i = 0; i < numFrames; i++) {
                target[i * 2] = l[i ];
                target[i * 2 + 1] = r[i];
            }
            return numFrames;
          }
        });
      }

      
    closeAudio(){
        if(this._gainNode){
            if(this._scriptNode){
                this._scriptNode.disconnect(this._gainNode);
                this._scriptNode = null;
                this._gainNode.disconnect(this._audioContext.destination);
            }
            
            this._gainNode = null;
            
        }
        if(this._audioContext){
            this._audioContext.close();
            this._audioContext = null;
        }
        this._audioPlayBuffers = [];
    }
    updatePTS(ts:number){
        this.pts = ts;
    }
    getTimestamp () {
        // if (this._audioContext) {
        //     return this._audioContext.currentTime * 1000;
        // } else {
        //     return 0;
        // }
        return this.pts;
    }
}