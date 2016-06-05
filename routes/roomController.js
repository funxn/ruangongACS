var mongoose = require('mongoose');
var express = require('express');
var model = require('../model/ops');  // ops数据库操作
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8181);

var sockTag = [];  // room_id,priority

var sockFlag = [];

sockFlag[room_id] = true;

// 宏
var STATE_OFF = 0;
var STATE_ON = 1;
var STATE_WAIT = 2;
var MODE_COLD = 0;
var MODE_HOT = 1;

var roomController = express.Router();
roomController.get('/',function(req,res){
    res.render('room');
});


// 接收房间空调请求：开机
// view: room_id, temp, state(当前状态：关机)
// model: code = 0/1/2, room_id, mode, target, min_temp, max_target
//        若中央空调为开启，返回result = "nak" 
roomController.post('/handshake',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){

        console.log("从客户端发过来的数据是："+postData);

        var handshakeData = JSON.parse(postData);    // 解析数据

        // 获取中央空调状态
       
        model.getCenterState().then(function(centerState){
            if (centerState == STATE_ON)                // 中央空调状态：运行
            {
                model.switch(handshakeData).then(function(data){
                    res.end(data);
                });
            } 
            else if (centerState == STATE_WAIT)          // 中央空调状态：待机
            {
                model.setCenterState({state:STATE_ON});  // 中央空调状态更新为运行
            }
            else                                         // 中央空调状态：停机
            {
                res.end(JSON.stringify({code:0,msg:"中央空调未开启"}));
            }
        });
    });
});


// 接收房间空调请求：停机
// view: room_id, state
// model: code:1 
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

        var shutdownData = JSON.parse(postData);    // 解析数据
        // 当前房间状态：3运行+1挂起，1运行/待机，其他

        // 3运行+1挂起：若停机的为运行，修改该房间为停机，则挂机的房间开始运行
        // 1运行/待机：修改该房间为停机，修改中央空调状态为待机
        // 其他：修改该房间为停机
        
        res.end(model.switch(shutdownData));
    });
});

// 接收房间空调请求：温控
// view: room_id, target, speed, 
// model: state, temp, cost
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

        var setData = JSON.parse(postData);    // 解析数据

        // 调度

    });
    
});


// 接收房间空调请求：改变目标温度
// view: room_id, target, speed, 
// model: state, temp, cost
roomController.post('/setTarget',function(req,res){
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

        var setData = JSON.parse(postData);    // 解析数据

        // 修改温控队列的值
    });
    
});

// 接收房间空调请求：改变风速
// view: room_id, speed
// model: state, temp, cost
roomController.post('/setSpeed',function(req,res){
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

        var setData = JSON.parse(postData);    // 解析数据

        // 调度

    });
    
});




// 接收房间空调请求：待机状态——温度变化
// view: room_id, temp
// model: result = "ack"
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

    var changedData = JSON.parse(postData);    // 解析数据
    
    model.changed(changedData);
    res.end(JSON.parse({code:1, obj: null}));
});


// 接收房间空调请求：查看费用
// view: room_id
// model: room_id, power, cost
roomController.post('/checkCost',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
    });

    var checkCostData = JSON.parse(postData);    // 解析数据？

    model.checkCost(checkCostData).then(function(data){
        res.end(data);
    });
});


function createSock(room_id, temp, target, speed){
    io.on('connection', function (socket) {
        socket.on('my'+room_id, function (data) {
            console.log(data);
        });

        var det;  // 增量因子  // speed 0,1,2
        
        if (temp < target)  // 暖
        {
            switch(speed)
            {
                case 0: det = 1.0/30; break; 
                case 1: det = 0.05; break;  // 0.05度/6s
                case 2: det = 0.1; break;   // 0.1度/6s
                default : det = 0; break;
            }
        }
        else  // 冷
        {
            switch(speed)
            {
                case 0: det = -1.0/30; break; // 1/30度/6s
                case 1: det = -0.05; break;   // 0.05度/6s
                case 2: det = -0.1; break;    // 0.1度/6s
                default : det = 0; break;
            }
        }

        var t = setInterval(function(){
            
            if (sockFlag[room_id] == false)   // 如果调度被中断
            {
                // 保存当前的信息,将该房间空调挂起

                clearInterval(t);
            }
            else if(abs(temp-target) < 0.001)  // 达到目标温度
            {
                // 修改该房间空调的状态为等待，从温控请求队列里删除，再次去调度

                clearInterval(t);
            }
            else
            {
                // 刷新信息：temp, state, cost
                socket.emit('room'+room_id, { freshTemp: temp , freshState: state, freshCost: cost});
            }

        }, 6000);
    });
}

function shedule()
{

}

// 导出router作为一个模块，供app.js调用
module.exports = roomController;