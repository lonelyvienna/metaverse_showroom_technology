import { _decorator } from "cc";

const {ccclass, property} = _decorator;

@ccclass
export default class MathUtils {

    public static getRndInteger(min: number, max: number) {

        var Range = max - min;

        var Rand = Math.random(); //获取[0-1）的随机数

        return (min + Math.round(Rand * Range)); //放大取整
    }
}
