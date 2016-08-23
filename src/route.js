var devId = '<weixin.devId>';
var appId = '<weixin.appId>';
var appSecret = '<weixin.appSecret>';
var openId = '<weixin.openId>';
var wxGetTokenApi = '<api.wxGetToken>';
var wxGetUserInfoApi = '<api.wxGetUserInfo>';
var wxGetUserAccountApi = '<api.wxGetUserAccount>';

var rp = require('request-promise');
var express = require('express');
var crypto = require('crypto');
var router = express.Router();
var wxAccessToken;

var token = "weixin";
router.get('/', function(req, res) {

    var signature = req.query.signature;
    var timestamp = req.query.timestamp;
    var nonce = req.query.nonce;
    var echostr = req.query.echostr;

    /*  加密/校验流程如下： */
    //1. 将token、timestamp、nonce三个参数进行字典序排序
    var array = new Array(token, timestamp, nonce);
    array.sort();
    var str = array.toString().replace(/,/g, "");

    //2. 将三个参数字符串拼接成一个字符串进行sha1加密
    var sha1Code = crypto.createHash("sha1");
    var code = sha1Code.update(str, 'utf-8').digest("hex");

    //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
    if (code === signature) {
        res.send(echostr);
    } else {
        res.send("error");
    }
});

router.post('/', function(req, res) {

    var reqXml = req.body.xml;
    var queryType = getQueryType(reqXml);
    var queryParams = getQueryParams(reqXml, queryType);

    getContent(queryType, queryParams).then(function(content) {
        //var content = '你好,你的openid是：' + req.query.openid;
        var msgType = 'text';
        var result = `<xml>
            <ToUserName><![CDATA[` + req.query.openid + `]]></ToUserName>
            <FromUserName><![CDATA[]]>` + devId + `</FromUserName>
            <CreateTime>2</CreateTime>
            <MsgType><![CDATA[` + msgType + `]]></MsgType>
            <Content><![CDATA[` + content + `]]></Content>
            </xml>`;
        console.log(result);
        res.send(result);
    });
});

router.get('/getAccessToken', function(req, res, next) {

    if (wxAccessToken)
        res.send('reload wxAccessToken = ' + wxAccessToken);

    var requestUrl = wxGetTokenApi.replace('APPID', appId).replace('APPSECRET', appSecret);
    return rp(requestUrl)
        .then(function(wxResult) {
            // Process html...
            var wxObj = JSON.parse(wxResult);
            console.log();
            wxAccessToken = wxObj.access_token;

            res.send('reset wxAccessToken = ' + wxObj.access_token);
        })
        .catch(function(err) {
            // Crawling failed...
            next(err);
        });
});

router.get('/getUserInfo', function(req, res) {
    if (!wxAccessToken)
        res.send('Please get wxAccessToken firest');

    var requestUrl = wxGetUserInfoApi.replace('ACCESS_TOKEN', wxAccessToken).replace('OPENID', openId);

    return rp(requestUrl)
        .then(function(wxResult) {
            // Process html...
            console.log(wxResult);

            res.send(wxResult);
        })
        .catch(function(err) {
            // Crawling failed...
            console.log(err);
            next();
        });
});

function getQueryType(xml) {
    var rawQueryType = xml.content.split(' ')[0];
    rawQueryType = rawQueryType.toLowerCase();

    var queryType;
    switch (rawQueryType) {
        case 'yecx':
            queryType = 'queryAccountByName';
            break;
        default:
            queryType = 'unknown';
            break;
    }

    return queryType;
}

function getQueryParams(xml, queryType) {
    var rawQueryParams = xml.content.replace(/\s+/g, ' ').split(' ');
    switch (queryType) {
        case 'queryAccountByName':
            if (rawQueryParams.length > 0)
                paramaters = {
                    name: rawQueryParams[1]
                };
            break;
        default:
            paramaters = {};
            break;
    }

    return paramaters;
}

function getContent(queryType, queryParams) {
    switch (queryType) {
        case 'queryAccountByName':
            return queryAccountByName(queryParams);
        default:
            return Promise.resolve('您输入的命令有误，请联系客服人员 (微信号:rainbow494)');
    };
}

function queryAccountByName(queryParams) {
    if (!queryParams || !queryParams.name)
        return 0;

    var requestUrl = wxGetUserAccountApi.replace(':USERNAME', queryParams.name);
    return rp(requestUrl)
        .then(function(userAccounts) {
            var results = JSON.parse(userAccounts);
            if (results[0].account)
                return '您的本月额为:' + results[0].account;
            else
                return '0';
        })
        .catch(function(err) {
            // Crawling failed...
            next(err);
        });
}

module.exports = router;