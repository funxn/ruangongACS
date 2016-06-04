var express = require('express');
var model = require('../model/ops');  // ops数据库操作


var roomController = express.Router();
roomController.get('/',function(req,res){
    res.render('room');
});


// 接收房间空调请求：开机
roomController.post('/handshake',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：room_id,temp
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
        var handshakeData = JSON.parse(postData);    // 解析数据
        model.switchOn(handshakeData).then(function(data){
            res.end(JSON.stringify(data));
        });
    });

    

});


// 接收房间空调请求：停机
roomController.post('/shutdown',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：room_id
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var shutdownData = JSON.parse(postData);    // 解析数据？
    // 调度：是否需要响应那个等待的Room4
    res.send(model.switchOff(handshakeData));
});


// 接收房间空调请求：温控
roomController.post('/set',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：room_id, target, speed
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var setData = JSON.parse(postData);    // 解析数据？
    // 调度
<<<<<<< HEAD
    // 
    res.end(model.set(setData));
=======
    //
    res.send(model.set(setData));
>>>>>>> 57a3702c0063c888f6b9e2b412eabb6b3c57a207
});


// 接收房间空调请求：待机状态——温度变化
roomController.post('/changed',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：room_id, temp
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var changedData = JSON.parse(postData);    // 解析数据？
<<<<<<< HEAD
    model.changed(changedData);
    res.end(JSON.parse({code:"OK", obj: null}));
=======

    res.end(model.changed(changedData));
>>>>>>> 57a3702c0063c888f6b9e2b412eabb6b3c57a207
});


// 接收房间空调请求：查看费用
roomController.post('/checkCost',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：room_id, temp
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var checkCostData = JSON.parse(postData);    // 解析数据？

    res.send(model.checkCost(setData));
});

// 导出router作为一个模块，供app.js调用
module.exports = roomController;