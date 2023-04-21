import TopView from "./TopView";
import Notification from "../../Notification";
import BaseMediator from "../../../default/mvc/core/base/BaseMediator";
 
export default class TopMediator extends BaseMediator {
 
    public view: TopView;
 
    public init(data?: any): void {
 
        this.registerNoti(Notification.MUSIC_PLAYING, ()=>{
            
            this.view.playMusic();
 
        }, this);
 
        this.registerNoti(Notification.MUSIC_PAUSE, ()=>{
            
            this.view.pauseMusic();
 
        }, this);
    }

    public viewDidAppear(): void {

        //this.view.init();
    }

    public destroy(): void {

    }
}