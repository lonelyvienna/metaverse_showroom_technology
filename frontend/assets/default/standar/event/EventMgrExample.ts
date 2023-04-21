import { Component, _decorator } from "cc";
import EventMgr from "./EventMgr";

const { ccclass, property } = _decorator;

export default class EventMgrExample extends Component {

    start () {
        
        EventMgr.getInstance().registerListener("kkk", this, this.hello);       //添加注册

        EventMgr.getInstance().sendListener("kkk", {"nihao":159});      //事件派发
    }

    hello(self, params)
    {
        console.log(self.node.name, params.nihao);
    }
}