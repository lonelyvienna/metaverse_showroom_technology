import { Component, _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export default class HttpUtils extends Component {

    /**
     * Get方法
     * @param {请求网址} url
     * @param {回调} callback
     * @param {头部参数} headParams
     */
    public static Get(url: string, callback: Function, headParams: any = null) {

        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {

            //如果请求状态为Done的话，则执行回调
            if (xhr.readyState == 4) {

                if (xhr.status >= 200 && xhr.status < 400) {

                    let response = xhr.responseText;

                    callback(null, response);

                } else {

                    callback("error", xhr.responseText);
                }

            }
        };

        xhr.open("GET", url, true);

        if (headParams) {

            for (let key in headParams) {

                xhr.setRequestHeader(key, headParams[key]);
            }
        }

        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        xhr.send();
    }

    /**
     * Post请求，表单提交
     * @param url 请求的网址
     * @param reqData 请求的数据
     * @param callback 回调函数
     */
    public static Post(url: string, reqData: any, callback: any, headParams: any = null) {

        //拼接请求参数
        let param = "";

        for (let item in reqData) {

            param += item + "=" + reqData[item] + "&";
        }

        //console.log(param);

        //发起请求
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {

            if (xhr.readyState == 4) {

                if (xhr.status >= 200 && xhr.status < 400) {

                    let response = xhr.responseText;

                    callback(null, response);

                } else {

                    callback("error", xhr.responseText);
                }
            }
        };

        xhr.open("POST", url, true);

        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        if (headParams) {

            for (let key in headParams) {

                xhr.setRequestHeader(key, headParams[key]);
            }
        }

        xhr.send(param);    //reqData为字符串形式： "key=value"
    }

    /**
     * Get方法
     * @param {请求网址} url
     * @param {回调} paramas
     * @param {回调} callback
     * @param {头部参数} headParams
     */
    public static GetJson(url: string, paramas: any, callback: Function, headParams: any = null) {

        //拼接请求参数
        if (paramas != null) {
            let resultUrl = "?";

            for (let item in paramas) {

                resultUrl += item + "=" + paramas[item] + "&";
            }

            resultUrl = resultUrl.slice(0, resultUrl.length - 1);       //删除最后一个&

            url += resultUrl;
        }

        console.log("请求网址：" + url);

        //请求
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {

            //如果请求状态为Done的话，则执行回调
            if (xhr.readyState == 4) {

                if (xhr.status >= 200 && xhr.status < 400) {

                    let response = xhr.responseText;

                    callback(null, response);

                } else {

                    callback("error", xhr.responseText);
                }

            }
        };

        xhr.open("GET", url, true);

        if (headParams) {

            for (let key in headParams) {

                xhr.setRequestHeader(key, headParams[key]);
            }
        }

        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");

        xhr.send();
    }

    /**
     * Post请求，Json提交
     * @param url 请求的网址
     * @param reqData 请求的数据
     * @param callback 回调函数
     */
    public static PostJson(url: string, param: any, callback: any, headParams: any = null) {

        //发起请求
        let xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {

            if (xhr.readyState == 4) {

                if (xhr.status >= 200 && xhr.status < 400) {

                    let response = xhr.responseText;

                    callback(null, response);

                } else {

                    callback("error", xhr.responseText);
                }
            }
        };

        xhr.open("POST", url, true);

        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");

        if (headParams) {

            for (let key in headParams) {

                xhr.setRequestHeader(key, headParams[key]);
            }
        }

        xhr.send(param);    //reqData为字符串形式： "key=value"
    }

    /**
     * 拼接请求参数
     * @param paramas 请求参数，object类型
     */
    public static SplicingParamas(paramas: any): string {

        let resultUrl = "";

        for (let item in paramas) {

            resultUrl += item + "=" + paramas[item] + "&";
        }

        resultUrl = resultUrl.slice(0, resultUrl.length - 1);       //删除最后一个&

        return resultUrl;
    }
}