/*
 * @Author: guofuyan
 * @Date: 2022-06-16 11:37:34
 * @LastEditTime: 2022-06-16 11:40:48
 * @Description: 
 */
import { Component, _decorator } from "cc";

const { ccclass, property } = _decorator;

export default class EventMgr extends Component {
    private dic = {};

    protected static instance: EventMgr;
    public static getInstance(): EventMgr {
        if (!this.instance) {
            this.instance = new EventMgr();
        }
        return this.instance;
    }

    registerListener(typeName: string, cc: Component, action: Function) {
        this.clearSingleRegister(typeName);
        if (!this.dic[typeName]) {
            this.dic[typeName] = [];
        }
        this.dic[typeName].push({ cc: cc, action: action });
    }

    unRegisterListener(typeName: string, cc: Component) {
        this.clearSingleRegister(typeName);
        if (!this.dic[typeName]) return;
        this.dic[typeName].splice(this.dic[typeName].indexOf(cc), 1);
    }

    clearSingleRegister(typeName: string) {
        if (this.dic[typeName]) {
            for (let i = this.dic[typeName].length - 1; i >= 0; i--) {
                if (!this.dic[typeName][i].cc.node) {
                    this.dic[typeName].splice(i, 1);
                }
            }
        }
    }

    sendListener(typeName: string, obj: any) {
        this.clearSingleRegister(typeName);
        if (this.dic[typeName]) {
            for (let i = 0; i < this.dic[typeName].length; i++) {
                if (this.dic[typeName][i].cc.node) {
                    this.dic[typeName][i].action(this.dic[typeName][i].cc, obj);
                }
            }
        }
    }
}
