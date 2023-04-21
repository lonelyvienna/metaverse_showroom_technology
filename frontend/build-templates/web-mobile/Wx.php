<?php
//微信方法
class Wx {
    //private $appId = 'wx94f8c61c85dc9075';
    //private $appSecret = 'ce300467aab17adcb36379a9d63813a9';
    //互动小精灵公众号信息
    private $appId = 'wx3690561798924aaa';
    private $appSecret = '9420b640bfa8ead278f0d17319690101';
    private $redis;
    public function __construct(){
        $this->redis = new \redis();
        $this->redis->connect('127.0.0.1', 6379);
        $this->redis->auth('tokushimazg');
    }
    public function getSignPackage() {
        $jsapiTicket = $this->getJsApiTicket();
        // 注意 URL 一定要动态获取，不能 hardcode.
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
        $url = "$protocol$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

        $timestamp = time();
        $nonceStr = $this->createNonceStr();

        // 这里参数的顺序要按照 key 值 ASCII 码升序排序
        $string = "jsapi_ticket=$jsapiTicket&noncestr=$nonceStr&timestamp=$timestamp&url=$url";
        $this->redis->set('string', $string);

//		$this->writeLog($string);
//		$this->writeLog('123');

        $signature = sha1($string);

        $signPackage = array(
            "appId"     => $this->appId,
            "nonceStr"  => $nonceStr,
            "timestamp" => $timestamp,
            "url"       => $url,
            "signature" => $signature,
            "rawString" => $string,
//            'jsapiTicket' => $jsapiTicket
        );
        return $signPackage;
    }

    public function createNonceStr($length = 16) {
        $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        $str = "";
        for ($i = 0; $i < $length; $i++) {
            $str .= substr($chars, mt_rand(0, strlen($chars) - i), 1);
        }
        return $str;
    }

    public function getJsApiTicket() {
        //redis存储方式
        $data = json_decode($this->redis->get('jsapi_tickets'),true);
        if ($data['expire_time'] < time() || empty($data)) {
            $accessToken = $this->getAccessToken();
            // 如果是企业号用以下 URL 获取 ticket
            // $url = "https://qyapi.weixin.qq.com/cgi-bin/get_jsapi_ticket?access_token=$accessToken";
            $url = "https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=$accessToken";
            $res = json_decode($this->httpGet($url));
            $ticket = $res->ticket;
            if ($ticket) {
                $data['expire_time'] = time() + 7000;
                $data['jsapi_tickets'] = $ticket;
                $re = $this->redis->set('jsapi_tickets',json_encode($data));
            }
        } else {
            $ticket = $data['jsapi_tickets'];
        }

        return $ticket;
    }
    function getAccessToken() {
        $appid = $this->appId;
        $appSecret = $this->appSecret;
        // access_token 应该全局存储与更新，以下代码以写入到文件中做示例
        $data = json_decode($this->redis->get('access_tokens'));
        if ($data->expire_time < time() || empty($data)) {
            $url = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=$appid&secret=$appSecret";
            $res = json_decode($this->httpGet($url));
            $access_token = $res->access_token;
            if ($access_token) {
                $data->expire_time = time() + 7000;
                $data->access_token = $access_token;
                $this->redis->set('access_tokens',json_encode($data));
            }
        } else {
            $access_token = $data->access_token;
        }
        return $access_token;
    }

    //media_id为微信jssdk接口上传后返回的媒体id
    public function uploadVoice($media_id){
        $access_token = $this->getAccessToken();
        $path = "./Uploads/record/";   //保存路径，相对当前文件的路径
        //微信上传下载媒体文件
        $url = "https://api.weixin.qq.com/cgi-bin/media/get?access_token=$access_token&media_id=$media_id";
//        $result = json_decode($this->httpGet($url),true);
//        return $result;
//        https://api.weixin.qq.com/cgi-bin/media/get?access_token=ACCESS_TOKEN&media_id=MEDIA_ID
        $filename = "wxupload_".time().rand(1111,9999);
        $this->downAndSaveFile($url,$path.$filename.".amr");
        $data["filepath"] = $path;
        $data["filename"] = $filename;
        // $data["url"] = $url;
        return $data;
    }

    //根据URL地址，下载文件
    public function downAndSaveFile($url,$savePath){
        ob_start();
        readfile($url);
        $content  = ob_get_contents();
        ob_end_clean();
        $size = strlen($content);
        $fp = fopen($savePath, 'a');
        fwrite($fp, $content);
        fclose($fp);
    }

    public function getOpenid($code){
        $url="https://api.weixin.qq.com/sns/oauth2/access_token?appid=".$this->appId."&secret=".$this->appSecret."&code=".$code."&grant_type=authorization_code";
        $result = json_decode($this->httpGet($url),true);
        return $result;
    }
    public function httpGet($url) {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_TIMEOUT, 500);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($curl, CURLOPT_URL, $url);
        $res = curl_exec($curl);
        curl_close($curl);
        return $res;
    }
    //获取用户头像等信息
    function getUserInfo($access_token,$openid){
        $url = "https://api.weixin.qq.com/sns/userinfo?access_token=$access_token&openid=$openid";
        $result = json_decode($this->httpGet($url),true);
        return $result;
    }
    //snsapi_userinfo
    function createOauthUrlForCode($redirectUrl){
//        $redirect_uri = urlencode($redirectUrl);
        return "https://open.weixin.qq.com/connect/oauth2/authorize?appid=".$this->appId."&redirect_uri=$redirectUrl&response_type=code&scope=snsapi_userinfo&state=art#wechat_redirect";
    }

    public function writeLog($word)
    {
        $file = 'log.log';
        if(file_exists($file)){
            echo 1111;
        }else{
            echo 2222;
            $file = mkdir('log.log', 0777);
            var_dump($file);
            echo 3333;
        }
        $fp = fopen($file,"a+b");
        flock($fp, LOCK_EX) ;
        $res = fwrite($fp,"执行日期：".strftime("%Y-%m-%d-%H：%M：%S",time())."\n".$word."\n\n");
        flock($fp, LOCK_UN);
        fclose($fp);
        return $res;
    }

    public function getString(){
        $res = $this->redis->get('string');
        var_dump($res);
        echo '<p>';
        var_dump( $this->redis->get('jsapi_tickets'));
        echo '<p>';
        var_dump( $this->redis->get('jsapi_ticket'));
//        return $res;
    }
}
