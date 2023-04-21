import { Sprite, SpriteFrame, _decorator, Animation, AudioSource } from "cc";
import { BaseView } from "../../../default/mvc/core/base/BaseView";

const { ccclass, property } = _decorator;

@ccclass
export default class TopView extends BaseView {

    @property({
        type: SpriteFrame,
        tooltip: "音乐播放时使用的图标Texture"
    })
    musicPlayingSpriteFrame: SpriteFrame = null;

    @property({
        type: SpriteFrame,
        tooltip: "音乐暂停时使用的图标Texture"
    })
    musicPauseSpriteFrame: SpriteFrame = null;

    isPlaying: boolean = true;        //默认是播放状态

    public init(data?: any): void {

        // var audio = document.getElementById("bgm");

        // if (audio != null) {

        //     audio.play();
        // }

        this.playMusic();
    }

    /**
    * 点击音乐按钮
    */
    musicIconButtonClicked(evt: Event, customEventData: string) {

        if (this.isPlaying) {

            this.pauseMusic();

        } else {

            this.playMusic();
        }
    }

    /**
     * 暂停音乐
     */
    pauseMusic() {

        let musicNode = this.node.getChildByName("Music");

        let audioSource = musicNode.getComponent(AudioSource);

        musicNode.getComponent(Sprite).spriteFrame = this.musicPauseSpriteFrame;

        musicNode.getComponent(Animation).stop();

        musicNode.angle = 0;

        this.isPlaying = false;

        if (audioSource.clip) { audioSource.pause(); }

        // var audio = document.getElementById("bgm");

        // if (audio != null) {

        //     audio.pause();
        // }
    }

    /**
     * 播放音乐
     */
    playMusic() {

        let musicNode = this.node.getChildByName("Music");

        let audioSource = musicNode.getComponent(AudioSource);

        musicNode.getComponent(Sprite).spriteFrame = this.musicPlayingSpriteFrame;

        musicNode.getComponent(Animation).play();

        this.isPlaying = true;

        if (audioSource.clip) { audioSource.play(); }

        // var audio = document.getElementById("bgm");

        // if (audio != null) {

        //     audio.play();
        // }
    }

    public static path(): string {

        return "prefab/ui/TopPage";
    }
}
