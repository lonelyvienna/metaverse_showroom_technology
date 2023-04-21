export class PlatformUtils {
    //微信小游戏
    static get isWX(): boolean {
        //@ts-ignore
        return window.wx && !window.qq && !window.tt;
    }
}