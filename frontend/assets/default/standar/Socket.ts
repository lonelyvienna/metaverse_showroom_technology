import { Component, _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class Socket extends Component {

    public static instance: Socket;     //单例

    private fromId: string = "";

    static getInstance() {

        if (!this.instance) {

            this.instance = new Socket();
        }

        return this.instance;
    }

    ws: any;

    /**
     * 连接Websocket
     * @param group Socket组
     */
    public connect(group: string = "default") {

        let self = this;

        self.ws = new WebSocket("ws://120.25.74.1:10500");

        this.fromId = this.makeString(6);

        let login_data = JSON.stringify({ "action": "login", "app_name": "Socket", "app_id": 105, "fromid": this.fromId, 'group': group });

        self.ws.onopen = function (event) {
            self.ws.send(login_data);
            console.log("websocket握手成功，发送登录数据:" + login_data);
        };
        self.ws.onmessage = function (event) {
            console.log("response text msg: " + event.data);
        };
        self.ws.onerror = function (event) {
            console.log("Send Text fired an error");
        };
        self.ws.onclose = function (event) {
            console.log("WebSocket instance closed.");
        };

        setTimeout(function () {
            if (self.ws.readyState === WebSocket.OPEN) {
                self.ws.send("Hello WebSocket, I'm a text message");
            } else {
                console.log(login_data);
            }
        }, 3);

    }

    /**
     * 向指定组发送消息
     * @param data 数据，格式为对象
     * @param group 通讯组，具体参考通讯
     */
    sendMessageByGroup(data: any, group: string) {

        //let data = { "action": "login", "number": number };

        let list = JSON.stringify({ "action": "to_group", "data": data, 'group': 'CaricaturePrinter' });

        console.log('websocket发送数据' + list);

        this.ws.send(list);
    }

    /**
     * 向指定组发送消息
     * @param data 数据，格式为对象
     * @param group 通讯组，具体参考通讯
     */
    sendMessageById(data: any, toid: string) {

        //let data = { "action": "login", "number": number };

        let list = JSON.stringify({ "action": "to_single", "data": data, "fromid": this.fromId, "toid": toid });

        console.log('websocket发送数据' + list);

        this.ws.send(list);
    }

    /**
     * 随机数生成
     */
    makeString(number: number = 6): string {
        let outString: string = '';
        let inOptions: string = 'abcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < number; i++) {

            outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
        }

        return outString;
    }
}
