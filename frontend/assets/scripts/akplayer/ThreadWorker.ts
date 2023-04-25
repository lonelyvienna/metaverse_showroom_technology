/* eslint-disable no-fallthrough */

import { BufferAsset, resources } from "cc";
import { IDecoder } from "./IDecoder";
import { PlatformUtils } from "./PlatformUtils";

/**

/**
 * Native thread
 */
export class ThreadWorker implements IDecoder {
    /**
     * Callback observable of data
     */
    public onRecv: ((success: boolean, data: any) => void) | undefined;
    //@ts-ignore
    private worker: Worker | wx.createWorker;
    private _threadUrl: string | undefined;

    /**
     * Create a thread
     * @param handler Runner. Runner's code will be copied to an isolated worker context.
     * @param mode Thread working mode (automatically detected if not given)
     */
    public constructor (private script:string,file:string = null) {
      
            if (typeof Worker !== 'undefined' || PlatformUtils.isWX) {
                if(file){
                    if(PlatformUtils.isWX){
                        //@ts-ignore
                        this.worker = wx.createWorker(file);
                    }else{
                        this.worker = new Worker(file);
                    }
                    
                }else{
                    const b = `(function(){
                        ${script}
                    })()`;
                    const blob = new Blob(
                        // [`onmessage=function(a){var h=${handler.toString()};postMessage(h(a.data))}`],
                        [b],
                        { type: 'application/javascript' },
                    );
                    if(PlatformUtils.isWX){
                         //@ts-ignore
                         this.worker = wx.createWorker(this._threadUrl = URL.createObjectURL(blob));
                    }else{
                        this.worker = new Worker(this._threadUrl = URL.createObjectURL(blob));
                    }
                    

                }
                if(PlatformUtils.isWX){
                    this.worker.onMessage((data: any) => {
                        this.send(true, data);
                    });
                   
                }else{
                    this.worker.onmessage = (event: MessageEvent) => {
                        this.send(true, event.data);
                    };
                    this.worker.onerror = (event: ErrorEvent) => {
                        this.send(false, event.error);
                    };
                }
               
               
            } else {
                throw new TypeError('Cannot create thread: Runnign environment does not support Web worker');
            }
       
    }
    public init(){

    }
    /**
     * Destroy thread
     * @return Is the thread stopped. Notice that `Promise` does not support stop and returned value will always
     * be false if thread is using `Promise`.
     */
    public terminate (): boolean {
       
            this.worker.terminate();
            this._threadUrl && URL.revokeObjectURL(this._threadUrl);
            this._threadUrl = undefined;
            return true;
        
    }

    private static _arrayBufferUTF8ToStr(array) {
        var out,i,len,c;
        var char2,char3;
        if (array instanceof ArrayBuffer) {
            array = new Uint8Array(array);
        }
     
        out = "";
        len = array.length;
        i = 0;
        while(i < len) {
            c = array[i++];
            switch(c >> 4) {
                case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
                    // 0xxxxxxx
                    out += String.fromCharCode(c);
                    break;
                case 12: case 13:
                    // 110x xxxx   10xx xxxx
                    char2 = array[i++];
                    out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                    break;
                case 14:
                    // 1110 xxxx  10xx xxxx  10xx xxxx
                    char2 = array[i++];
                    char3 = array[i++];
                    out += String.fromCharCode(((c & 0x0F) << 12) |
                        ((char2 & 0x3F) << 6) |
                        ((char3 & 0x3F) << 0));
                    break;
            }
        }
     
        return out;
    }

    public static asyncCreate(url:string,file:string = null):Promise<ThreadWorker> {
        return new Promise<ThreadWorker>((resolve,reject)=>{
            if(file != null){
                let tw = new ThreadWorker(null,file);
                    resolve(tw);
                    return;
            }
            resources.load(url,BufferAsset, (err, asset) => {
                //    console.log(asset);
                    if(asset == null){
                        reject(false);
                        return;
                    }
                    //@ts-ignore
                    const script = `${this._arrayBufferUTF8ToStr(asset.buffer())}`;
                    //console.log(script);
                    let tw = new ThreadWorker(script,null);
                    resolve(tw);
                });
        })
    }
    /**
     * Send a value to thread for compute
     * @param value Target value
     */
    public postMessage (value: any): void {
        if(value && value.d){
            this.worker.postMessage(value,[value.d]);
        }else{
            this.worker.postMessage(value);
        }
       
    }

    private send (success: boolean, data: any): void {
        this.onRecv?.(success, data);
    }
}
