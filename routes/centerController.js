var express = require('express');
var model = require('../model/ops');  // ops数据库操作
//var router = express.Router();

var centerController = express.Router();
centerController.get('/',function(req,res){
    res.render('center');
});


// 接收空调管理员的post请求：配置中央空调
centerController.post('/initConfig',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：代表有从中央空调初始化设置界面post过来的数据
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var config = JSON.parse(postData);    // 解析数据
    // 调用model:存中央空调的初始化信息
    // 中央空调初始化设置界面：mode，default_temp，min_temp, max_temp

    model.initConfig(config).then(function(data){
        res.end(JSON.stringify(data));
    });
   // res.end(model.initConfig(config));
});


// 接收空调管理员的get请求：启动/停止中央空调
centerController.get('/switch',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    res.end(model.switch());
});


// 接收空调管理员的get请求:查看空调信息
centerController.get('/checkAir',function(req,res){
     
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    // 一直推送信息，需要怎样子实时获取中央空调和房间空调的信息
    res.end(model.checkAir());
});


// 导出centerController作为一个模块，供app.js调用
module.exports = centerController;



