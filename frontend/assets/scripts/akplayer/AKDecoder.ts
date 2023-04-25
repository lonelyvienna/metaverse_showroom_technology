/* eslint-disable no-fallthrough */

import { BufferAsset, resources } from "cc";
import { PlatformUtils } from "./PlatformUtils";
import FFMPEG from "../../libs/ffmpeg.mjs";
import { IDecoder } from "./IDecoder";


function dispatchData(input) {
    let need = input.next()
    let buffer = null
    return (value) => {
        var data = new Uint8Array(value)
        
        if (buffer) {
            var combine = new Uint8Array(buffer.length + data.length)
            combine.set(buffer)
            combine.set(data, buffer.length)
            data = combine
            buffer = null
        }
        while (data.length >= need.value) {
            var remain = data.slice(need.value)
            need = input.next(data.slice(0, need.value))
            data = remain
        }
        if (data.length > 0) {
            buffer = data
        }
    }
}



if (!Date.now) Date.now = function () {
    return new Date().getTime();
};

FFMPEG.print = function (text) {
   // this.sendMessage({cmd: "print", text: text})
   console.log("print");
}
FFMPEG.printErr = function (text) {
   // this.sendMessage({cmd: "printErr", text: text})
    console.log("printErr");
}
FFMPEG.postRun = function () {
    console.log("postRun");
}

class SpeedSampler{
    _firstCheckpoint= 0;
    _lastCheckpoint= 0;
    _intervalBytes= 0;
    _lastSecondBytes= 0;
    _downloadDone= false;
    addBytes (bytes) {
        if (this._firstCheckpoint === 0) {
            this._firstCheckpoint = Date.now();
            this._lastCheckpoint = this._firstCheckpoint;
            this._intervalBytes += bytes;
        } else if (Date.now() - this._lastCheckpoint < 1000) {
            this._intervalBytes += bytes;

        } else {
            this._lastSecondBytes = this._intervalBytes;
            this._intervalBytes = bytes;
            this._lastCheckpoint = Date.now();
        }
    }
    isDone() {
        return this._downloadDone;
    }
    reset () {
        this._firstCheckpoint = this._lastCheckpoint = 0;
        this._intervalBytes = 0;
        this._lastSecondBytes = 0;
        this._downloadDone = false;
    }
    setDownloadDown() {
        this._downloadDone = true;
    }
    getCurrentKBps() {
        this.addBytes(0);
        var durationSeconds = (Date.now() - this._lastCheckpoint) / 1000;
        if (durationSeconds == 0) durationSeconds = 1;
        return (this._intervalBytes / durationSeconds) / 1024;
    }
    getLastSecondKBps () {
        this.addBytes(0);
        if (this._lastSecondBytes !== 0) {
            return this._lastSecondBytes / 1024;
        } else {
            if (Date.now() - this._lastCheckpoint >= 500) {
                return this.getCurrentKBps();
            } else {
                return 0;
            }
        }
    }
}

/**
 * Native thread
 */
export class AKDecoder implements IDecoder {
    opt= {debug:false,hasAudio:true,isFlv:true};
    buffer= [];
    bufferQueue= [];
    remain= 0;
    channels= 0;
    videoFrameSize= 0;
    videoBuffer = 0;
    firstTimestamp = 0;
    startTimestamp = 0;
    delay = 0;
    ts = 0;
    ws = null;

    dropping = false;
    flvMode = false;
    speedSampler = null;

    //seeking
    seeking = false;
    seekingDone = false;
    seekPts = 0;
    seekStart = 0;

    //remote file
    fileSize = 0;
    fileSizeStart = 0;
    fileSizeOffset = 0;
    fileSizeChunk = 65535;
    fileUrl = "";
    downloading = false;
    fileDispatch = null;
    //timer
    stopId = null;
    speedSamplerId = null;
    downloadId = null;
    //live stream flag 
    isStream = false;
    controller = null;
    //decoder
    audioDecoder= null;
    videoDecoder = null;
    /**
     * Callback observable of data
     */
    public onRecv: ((success: boolean, data: any) => void) | undefined;
    public constructor (private script:string,file:string = null) {
        
    }

    /**
     * Destroy thread
     * @return Is the thread stopped. Notice that `Promise` does not support stop and returned value will always
     * be false if thread is using `Promise`.
     */
    public terminate (): boolean {
        this.close();
        return true;
        
    }

    public init(){
        this.speedSampler = new SpeedSampler();
        this.sendMessage({cmd: "init"})
    }
    public static asyncCreate(url:string = null,file:string = null):Promise<AKDecoder> {
        return new Promise<AKDecoder>((resolve,reject)=>{
            let tw = new AKDecoder(null,null);
            resolve(tw);
        })
    }
    /**
     * Send a value to thread for compute
     * @param value Target value
     */
    public postMessage (value: any): void {
        var msg = value;
        switch (msg.cmd) {
            case "init":
                this.opt = JSON.parse(msg.opt);
                
                this.audioDecoder = new FFMPEG.AudioDecoder(this)
                this.audioDecoder.sample_rate = msg.sampleRate;
                if(msg.video == 1){
                    this.videoDecoder =  new FFMPEG.VideoYUVDecoder(this)
                }else{
                    this.videoDecoder = new FFMPEG.VideoRGBDecoder(this)
                }
                
                // kVideoRGB = 0,
                //kVideoYUV = 1,
                break
            case "play":
                if(msg.fileSize){
                    this.play(msg.url,+msg.fileSize)
                }else{
                    this.play(msg.url,0)
                }
                
                break
            case "setVideoBuffer":
                this.videoBuffer = (msg.time * 1000) | 0
                break
            case "close":
                this.close()
                break
            case "resume":
                this.resume();
                break;
            case "pause":
                this.pause();
                break;
            case "fileInfo":
                if(PlatformUtils.isWX){
                    this.getFileInfoByWX(msg.url);
                }else{
                    this.getFileInfoByHttp(msg.url);
                }
                break;
            case "seekTo":
                this.seekTo(msg.pts,msg.start);
                break;
        }
        
    }

    private send (success: boolean, data: any): void {
        this.onRecv?.(success, data);
    }

    public sendMessage(data:any){
        this.send(true,data);
    }

    playDone() {
        this.sendMessage({cmd: "playDone"});
    }
    initAudio (channels, samplerate,ts) {
        this.sendMessage({cmd: "initAudio", samplerate: samplerate, channels: channels,ts:ts})
        this.buffer = []
        this.remain = 0;
        this.channels = channels;
    }
    playAudio(data, len,ts,nb_samples) {
           
        var frameCount = len;
        var cap = 4096;
        var origin = []
        var start = 0
        for (var channel = 0; channel < 2; channel++) {
            var fp = FFMPEG.HEAPU32[(data >> 2) + channel] >> 2;
            origin[channel] = FFMPEG.HEAPF32.subarray(fp, fp + frameCount);
        }
        if (this.remain) {
            len = cap - this.remain
            if (frameCount >= len) {
                let outputArray = [];
                var tmp0 = new Float32Array(this.buffer[0].length + len);
                tmp0.set(this.buffer[0], 0);
                tmp0.set(origin[0].subarray(0, len),this.buffer[0].length);

                outputArray[0] =tmp0; // Float32Array.of(...this.buffer[0], ...origin[0].subarray(0, len))
                if (this.channels == 2){
                    var tmp1 = new Float32Array(this.buffer[1].length + len);
                    tmp1.set(this.buffer[1], 0);
                    tmp1.set(origin[1].subarray(0, len),this.buffer[1].length);

                    outputArray[1] = tmp1;// Float32Array.of(...this.buffer[1], ...origin[1].subarray(0, len))
                    this.sendMessage({cmd: "playAudio", buffer0: outputArray[0].buffer,buffer1:outputArray[1].buffer,ts:ts})
                }else{
                    this.sendMessage({cmd: "playAudio", buffer0: outputArray[0].buffer,buffer1:null,ts:ts})
                }
               

                start = len
                frameCount -= len
            } else {
                this.remain += frameCount;
                var tmp0 = new Float32Array(this.buffer[0].length + origin[0].length);
                tmp0.set(this.buffer[0], 0);
                tmp0.set(origin[0],this.buffer[0].length);

                this.buffer[0] = tmp0;//Float32Array.of(...this.buffer[0], ...origin[0])
                if (this.channels == 2) {
                    var tmp1 = new Float32Array(this.buffer[1].length + origin[1].length);
                    tmp1.set(this.buffer[1], 0);
                    tmp1.set(origin[1],this.buffer[1].length);
                    this.buffer[1] = tmp1;//Float32Array.of(...this.buffer[1], ...origin[1])
                }
                return
            }
        }
        let outputArray = [];
        for (this.remain = frameCount; this.remain >= cap; this.remain -= cap) {
            outputArray[0] = origin[0].slice(start, start += cap)
            if (this.channels == 2){ 
                outputArray[1] = origin[1].slice(start - cap, start);
                this.sendMessage({cmd: "playAudio", buffer0: outputArray[0].buffer,buffer1:outputArray[1].buffer,ts:ts})
            }else{
                this.sendMessage({cmd: "playAudio", buffer0: outputArray[0].buffer,buffer1:null,ts:ts})
            }
        }
        if (this.remain) {
            this.buffer[0] = origin[0].slice(start)
            if (this.channels == 2) this.buffer[1] = origin[1].slice(start)
        }
    }
    setAudioCodec(type){
        this.sendMessage({cmd: "audioCodec", type:type})
    }
    uint8ToStr(data) {
        return String.fromCharCode.apply(null, data);
    }
    uint8ToDouble(data) {
        var temp = new Uint8Array(data);
        var dv = new DataView(temp.buffer);
        var str = dv.getFloat64(0);
        dv = null;
        temp = null;
        return str;
    }
    *inputFlv () {
        yield 9
        var tmp = new ArrayBuffer(4)
        var tmp8 = new Uint8Array(tmp)
        var tmp32 = new Uint32Array(tmp)
        while (true) {
            tmp8[3] = 0
            var t = yield 15
            var type = t[4]
            tmp8[0] = t[7]
            tmp8[1] = t[6]
            tmp8[2] = t[5]
            var length = tmp32[0]
            tmp8[0] = t[10]
            tmp8[1] = t[9]
            tmp8[2] = t[8]
            var ts = tmp32[0]
            if (ts === 0xFFFFFF) {
                tmp8[3] = t[11]
                ts = tmp32[0]
            }
            var payload = yield length
            switch (type) {
                case 8:
                    this.opt.hasAudio && this.bufferQueue.push({ts, payload, decoder: this.audioDecoder, type: 0})
                    break
                case 9:
                    this.bufferQueue.push({ts, payload, decoder: this.videoDecoder, type: payload[0] >> 4})
                    break;
                case 18:
                    if(payload && payload.length > 37){
                        var key = this.uint8ToStr(payload.subarray(20,28));
                        var duration = this.uint8ToDouble(payload.subarray(29,37));
                        this.sendMessage({cmd: "duration", duration: duration*1000});
                    }
                    break;
                default:
                    break;
            }
        }
    }
    loop() {
        if (this.bufferQueue.length) {
            
            if(this.seeking){
               
                if(this.bufferQueue[0].ts < this.seekPts){
                    this.bufferQueue.shift();
                    while (this.bufferQueue.length && this.bufferQueue[0].ts < this.seekPts ) {
                        this.bufferQueue.shift();
                    }
                }else{
                    this.dropping = true;
                    this.seeking = false;
                    this.seekingDone = true;
                }
                
            }else if (this.dropping) {
              
                data = this.bufferQueue.shift()
                while (data.type !== 1 && this.bufferQueue.length) {
                    data = this.bufferQueue.shift()
                }
                if (data.type === 1) { //keyframe
                    this.dropping = false;
                    this.firstTimestamp = 0;
                    if(this.seekingDone){
                        this.seekingDone = false;
                        this.sendMessage({cmd: "seekingDone",ts:data.ts})
                       
                    }
                    var islast = (this.bufferQueue.length == 0 && this.speedSampler.isDone());
                   
                    if(!this.seeking){
                        data.decoder.decode(data.payload,data.ts,islast?1:0);
                    }
                    
                }
            }else {
                var data = this.bufferQueue[0]
                if (this.getDelay(data.ts) === -1) {
                    this.bufferQueue.shift()
                    this.ts = data.ts;
                    var islast = (this.bufferQueue.length == 0 && this.speedSampler.isDone());
                    
                    data.decoder.decode(data.payload,data.ts,islast?1:0);
                } else if (this.delay > this.videoBuffer + 1000) {
                    this.dropping = true
                } else {
                    while (this.bufferQueue.length) {
                        data = this.bufferQueue[0]
                        if (this.getDelay(data.ts) > this.videoBuffer) {
                            this.bufferQueue.shift()
                            this.ts = data.ts;
                            var islast = (this.bufferQueue.length == 0 && this.speedSampler.isDone());
                            
                            data.decoder.decode(data.payload,data.ts,islast?1:0);
                        } else {
                            break
                        }
                    }
                }
            }
        }
    }
    startLoop(){
        if(this.stopId){
            this.stopLoop();
        }
        this.stopId = setInterval(this.loop.bind(this), 10);
    }
    stopLoop(){
        if(this.stopId){
            clearInterval(this.stopId);
            this.stopId = null;
        }
    }
    startSpeedSampler(){
        if(this.speedSamplerId){
            this.stopSpeedSampler();
        }
        this.speedSamplerId = setInterval(() => {
            this.sendMessage({cmd: "kBps", kBps: this.speedSampler.getLastSecondKBps()})
        }, 1000);
    }
    stopSpeedSampler(){
        if(this.speedSamplerId){
            clearInterval(this.speedSamplerId);
            this.speedSamplerId = null;
        }
        
    }
    resume(){
        this.loop();
        this.startLoop();
        this.startSpeedSampler();
        if(!this.isStream){
            this.startHttpDownloader();
        }
        
    }
    pause(){
        this.firstTimestamp=0;
        this.stopLoop();
        this.stopSpeedSampler();
        if(!this.isStream){
            this.stopHttpDownloader();
        }
    }
    getDelay(timestamp) {
        if (!timestamp) return -1;
        if(!this.firstTimestamp){
            this.firstTimestamp = timestamp
            this.startTimestamp = Date.now()
        }
        this.delay = (Date.now() - this.startTimestamp) - (timestamp - this.firstTimestamp);
        return this.delay;
    }
    getFileInfoByHttp (url) {
        var size = 0;
        var status = 0;
        var reported = false;

        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.onreadystatechange = () => {
            var len = xhr.getResponseHeader("Content-Length");
            if (len) {
                size = +len;
            }
            if (xhr.status) {
                status = xhr.status;
            }
            //Completed.
            if (!reported && ((size > 0 && status > 0) || xhr.readyState == 4)) {
                this.sendMessage({
                    cmd: "fileSize",
                    fileSize: size,
                    status: status,
                });
                reported = true;
                xhr.abort();
            }
        };
        xhr.send();
    }
    seekTo(pts,start){
        this.seekPts = pts;
        this.seekStart = start;
        this.seeking = true;
        this.seekingDone = false;
    }
    getFileInfoByWX(url:string){
        var size = 0;
        var status = 0;
        var reported = false;
        //@ts-ignore
        const requestTask = wx.request({
            url: url, //仅为示例，并非真实的接口地址
            method: "get",
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            success: function(res) {
              console.log(res)
            }
        });
        requestTask.onHeadersReceived((res) => {
            console.log(res);
            if(res.header && res.header["Content-Length"]){
                var len = res.header["Content-Length"];
                if (len) {
                    size = len;
                }
                if (res.header["status"]) {
                    status = res.header["status"];
                }
                //Completed.
                if (!reported && ((size > 0 && status > 0) || res.header["readyState"] == 4)) {
                    this.sendMessage({
                        cmd: "fileSize",
                        fileSize: size,
                        status: status,
                    });
                    reported = true;
                    
                }
            }
            requestTask.abort();
          })
    }
    downloadFileByWX(url:string,start:number,end:number){
        console.log("downloadFileByWX",start,end);
        //@ts-ignore
        const requestTask = wx.request({
            url: url, //仅为示例，并非真实的接口地址
            method: "get",
            data:{},
            header: {
                'Content-Type': 'application/x-www-form-urlencoded',
                "Range":"bytes=" + start + "-" + end
            },
            responseType: 'arraybuffer',
            success: function(res) {
                console.log(res);
                let value =new Uint8Array(res.data);
                this.speedSampler.addBytes(value.byteLength);
                this.fileDispatch(value);
                var len = end - start + 1;
                this.fileSizeOffset += len;
                this.downloading = false;
            }
        });
    }
    downloadFileByHttp (url, start, end) {
        var xhr = new XMLHttpRequest;
        xhr.open('get', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.setRequestHeader("Range", "bytes=" + start + "-" + end);
        var that = this;
        
       
        xhr.onload = ()=>{
           //start, end, seq, xhr.response;
            let value = xhr.response;
           
            this.speedSampler.addBytes(value.byteLength);
            that.fileDispatch(value);
            var len = end - start + 1;
            this.fileSizeOffset += len;
            
            that.downloading = false;
           
        };
        xhr.send();
    }
    startHttpDownloader(){
        if(this.downloadId){
            this.stopHttpDownloader();
        }
        this.downloadId = setInterval(this.httpDownloader.bind(this), 200);
    }
    stopHttpDownloader(){
        if(this.downloadId){
            clearInterval(this.downloadId);
            this.downloadId = null;
        }
    }
    httpDownloader() {
        if(this.downloading) return;
        this.downloading = true;
        var start = this.fileSizeOffset;
        
        if (start >= this.fileSize) {
            this.stopHttpDownloader();
            this.speedSampler.setDownloadDown();
            return;
        }
        var end = start + this.fileSizeChunk - 1;
        if (end >=  this.fileSize) {
            end =  this.fileSize - 1;
        }

        var len = end - start + 1;
        if (len > this.fileSizeChunk) {
            return;
        }
        if(PlatformUtils.isWX){
            this.downloadFileByWX(this.fileUrl,start,end);
        }else{
            this.downloadFileByHttp(this.fileUrl,start,end);
        }
        
    }
    play (url,fileSize) {
        this.opt.debug && console.log('Player play', url)
        this.startLoop();
        this.startSpeedSampler();
        this.isStream = true;
        if(fileSize){
            this.flvMode = true;
            this.isStream = false;
            this.fileSize = fileSize;
            this.fileSizeStart = 0;
            this.fileSizeOffset = 0;
            this.fileSizeChunk = 65535;
            this.fileUrl = url;
            this.downloading = false;
            let input = this.inputFlv();
            this.fileDispatch = dispatchData(input);
            this.httpDownloader();
            this.startHttpDownloader();
        }else if (url.indexOf("http") == 0) {
            this.flvMode = true;
            var _this = this;
            if(PlatformUtils.isWX){
                var input = _this.inputFlv()
                var dispatch = dispatchData(input);
                //@ts-ignore
                const requestTask = wx.request({
                      url: url,
                      method: "get",
                      header: {
                          'Content-Type': 'application/x-www-form-urlencoded',
                      },
                      responseType: 'arraybuffer',
                      enableChunked:true,
                      success: function(res) {
                        console.log("success",res)
                      },
                      fail: function(res){
                          console.log("fail",res)
                      },
                      complete:function(res){
                          console.log("complete",res);
                      }
                  });
                 
                  requestTask.onChunkReceived((res) => {
                      console.log("onChunkReceived",res);
                      let value = new Uint8Array(res.data);
                    //   if (done) {
                    //     this.speedSampler.setDownloadDown();
                    //     input.return(null)
                    // } else {
                        this.speedSampler.addBytes(value.byteLength);
                        dispatch(value)
                    //}
                  });
                  
            }else{
                this.controller = new AbortController();
                fetch(url, {signal: this.controller.signal}).then((res) => {
                    var reader = res.body.getReader();
                    var input = _this.inputFlv()
                    var dispatch = dispatchData(input);
                    var fetchNext = () => {
                        reader.read().then(({done, value}) => {
                            if (done) {
                                this.speedSampler.setDownloadDown();
                                input.return(null)
                            } else {
                                this.speedSampler.addBytes(value.byteLength);
                                dispatch(value)
                                fetchNext()
                            }
                        }).catch((e) => {
                            input.return(null);
                            _this.opt.debug && console.error(e);
                            if (e.toString().indexOf('The user aborted a request') === -1) {
                                this.sendMessage({cmd: "printErr", text: e.toString()});
                            }
                        })
                    }
                    fetchNext();
                }).catch((err) => {
                    this.sendMessage({cmd: "printErr", text: err.toString()})
                })
            }
           
           
        } else {
            this.flvMode = url.indexOf(".flv") != -1 || this.opt.isFlv;
            this.ws = new WebSocket(url)
            this.ws.binaryType = "arraybuffer"
            if (this.flvMode) {
                let input = this.inputFlv();
                var dispatch = dispatchData(input);
                this.ws.onmessage = evt => {
                    this.speedSampler.addBytes(evt.data.byteLength);
                    dispatch(evt.data)
                }
                this.ws.onerror = (e) => {
                    input.return(null);
                    this.sendMessage({cmd: "printErr", text: e.toString()});
                }
            } else {
                this.ws.onmessage = evt => {
                    this.speedSampler.addBytes(evt.data.byteLength);
                    var dv = new DataView(evt.data)
                    switch (dv.getUint8(0)) {
                        case 1:
                            this.opt.hasAudio && this.bufferQueue.push({
                                ts: dv.getUint32(1, false),
                                payload: new Uint8Array(evt.data, 5),
                                decoder: this.audioDecoder,
                                type: 0
                            })
                            break
                        case 2:
                            if (dv.byteLength > 5) {
                                this.bufferQueue.push({
                                    ts: dv.getUint32(1, false),
                                    payload: new Uint8Array(evt.data, 5),
                                    decoder: this.videoDecoder,
                                    type: dv.getUint8(5) >> 4
                                })
                            }
                            break
                    }
                }
                this.ws.onerror = evt => {
                    this.sendMessage({cmd: "printErr", text: evt.toString()});
                }
            }
          
        }
        
    }
    _close(){
        if(this.controller){
            this.controller.abort()
            this.controller = null;
        }
        if (this.ws) {
            this.ws.close && this.ws.close();
            this.ws = null;
        }
    }
    setVideoSize (w, h,ts) {
        this.sendMessage({cmd: "initSize", w: w, h: h,ts:ts})
        this.videoFrameSize = w * h;
    }
    draw (compositionTime, y, u, v,timestamp){
        var size = this.videoFrameSize;
        var qsize = size >> 2;
        var yuv = [FFMPEG.HEAPU8.subarray(y, y + size), FFMPEG.HEAPU8.subarray(u, u + qsize), FFMPEG.HEAPU8.subarray(v, v + (qsize))];
        var outputArray = yuv.map(buffer => Uint8Array.from(buffer))
        // arrayBufferCopy(HEAPU8.subarray(y, y + size), this.sharedBuffer, 0, size)
        // arrayBufferCopy(HEAPU8.subarray(u, u + (qsize)), this.sharedBuffer, size, qsize)
        // arrayBufferCopy(HEAPU8.subarray(v, v + (qsize)), this.sharedBuffer, size + qsize, qsize)
        this.sendMessage({
            cmd: "render",
            compositionTime: compositionTime,
            delay: this.delay,
            ts: this.ts,
            y: outputArray[0].buffer,
            u: outputArray[1].buffer,
            v: outputArray[2].buffer
        })
    }
    drawRGB (compositionTime, buff,size,timestamp) {
        
        var outArray = FFMPEG.HEAPU8.subarray(buff, buff + size);
        var data = new Uint8Array(outArray);
        this.sendMessage({
            cmd: "renderRGB",
            compositionTime: compositionTime,
            delay: this.delay,
            ts: this.ts,
            rgb: data.buffer
        });
    }
    close () {
        if (this._close) {
            this.opt.debug && console.log('worker close');
            this._close();
            this.stopLoop();
            this.stopSpeedSampler();
            this.stopHttpDownloader();
            this.speedSampler.reset();
            this.ws = null;
            this.audioDecoder.clear();
            this.videoDecoder.clear();
            this.firstTimestamp = 0;
            this.startTimestamp = 0;
            this.delay = 0;
            this.ts = 0;
            this.seeking = false;
            this.flvMode = false;
            this.bufferQueue = [];
            
        }
    }
}
