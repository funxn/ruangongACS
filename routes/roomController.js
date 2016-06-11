var mongoose = require('mongoose');
var express = require('express');
var model = require('../model/ops');  // ops数据库操作

var sockTag = [];  // room_id,priority,
var recordId = [];
var canrunFlag = [];
var imRecord = [];


// 宏
var STATE_OFF = 0;
var STATE_ON = 1;
var STATE_WAIT = 2;
var MODE_COLD = 0;
var MODE_HOT = 1;

var roomController = express.Router();


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
        console.log("handshake: 从客户端发过来的数据是 "+postData);
        var handshakeData = JSON.parse(postData);    // 解析数据

        //获取中央空调状态
        model.getCenterState().then(function(centerState){
            if (centerState == STATE_ON)                // 中央空调状态：运行
            {
                model.switch(handshakeData).then(function(data){
                    // 添加一条记录和一个操作到数据库
                    model.newRecord(data).then(function(data){
                        recordId[handshakeData.room_id] = data.record_id;
                        imRecord[data.record_id] = {};
                        imRecord[data.record_id].changeTempCount = 0;
                        imRecord[data.record_id].changeSpeedCount = 0;
                        imRecord[data.record_id].scheduleCount = 0;
                        imRecord[data.record_id].serveTime = 0;
                        imRecord[data.record_id].serveStartTime = 0;
                    },function(err){console.log("handshake newRecord error: "+err)});
                    // model.newOperation({room_id: data.room_id, operation: 'handshake'});
                    model.initSetting(data).then(function(redata){
                        res.end(JSON.stringify({code: 1, data: redata}));
                    },function(err){JSON.stringify({code:0, err:"initSetting error: "+err});});
                },function(err){ res.end(JSON.stringify({code: 0, err: "handshake Error: "+err})); });
            }
            else if (centerState == STATE_WAIT)          // 中央空调状态：待机
            {
                model.setCenterState({state:STATE_ON});  // 中央空调状态更新为运行
                model.switch(handshakeData).then(function(data){
                    // 添加一条记录和一个操作到数据库
                    model.newRecord(data).then(function(data){
                        recordId[handshakeData.room_id] = data.record_id;
                        imRecord[data.record_id] = {};
                        imRecord[data.record_id].changeTempCount = 0;
                        imRecord[data.record_id].changeSpeedCount = 0;
                        imRecord[data.record_id].scheduleCount = 0;
                        imRecord[data.record_id].serveTime = 0;
                        imRecord[data.record_id].serveStartTime = 0;
                    },function(err){console.log("handshake newRecord error: "+err)});
                    // model.newOperation({room_id: data.room_id, operation: 'handshake'});
                    model.initSetting(data).then(function(redata){
                        res.end(JSON.stringify({code: 1, data: redata}));
                    },function(err){JSON.stringify({code:0, err:"initSetting error: "+err});});
                },function(err){ res.end(JSON.stringify({code: 0, err: "handshake Error: "+err})); });
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
        model.switch(shutdownData).then(function(data){
            res.end(JSON.stringify({code: 1, data: data}));
            // 每次有修改都要set一下对应的数据库的记录，包括关机
            var thisRecord = imRecord[recordId[data.room_id]];
            // 累计时间
            thisRecord.serveTime += new Date().getTime() - thisRecord.serveStartTime;
            model.setRecord({
                record_id: recordId[data.room_id],
                end_temp: shutdownData.temp,
                power: data.cost,
                changeTempCount: thisRecord.changeTempCount,
                changeSpeedCount: thisRecord.changeSpeedCount,
                scheduleCount: thisRecord.scheduleCount,
                serveTime: thisRecord.serveTime
            });
            // @xiaofeng: 不用！！！删除掉临时的imRecord[record_id]项
            //imRecord.splice(recordId[data.room_id], 1);
            // 删除sockTag, canrunFlag元素
            for(i=0; i<sockTag.length; i++)
                if(sockTag[i].room_id == shutdownData.room_id){
                    sockTag.splice(i, 1);
                }
            //@xiaofeng: 使用splice应注意！！！，会影响到后面的下标值
            canrunFlag[shutdownData.room_id] = undefined;
            // 删除房间记录：
            model.delRoom(shutdownData);
        },function(err){ res.end(JSON.stringify({code: 0, err: "handshake Error: "+err})); });
        // 当前房间状态：3运行+1挂起，1运行/待机，其他

        // 3运行+1挂起：若停机的为运行，修改该房间为停机，则挂机的房间开始运行
        // 1运行/待机：修改该房间为停机，修改中央空调状态为待机
        // 其他：修改该房间为停机
        // model.switch(shutdownData).then(function(data){
        //     model.setRecord({record_id:recordId[data.room_id], power: data.cost, end_temp: data.temp})
        //     model.newRecord(data);
        //     clearTimeout(t[room_id]);
        //     res.end(model.switch(shutdownData));
        // }, function(err){res.end("shutdown Error: "+err);});
    });
});

// 接收房间空调请求：温度调控
// view: room_id, target, speed,
// model: state, temp, cost
// @xiaofeng: 每次收到 /run 请求就是调度中一次信息的同步
roomController.post('/run',function(req,res){
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

        // 如果当前房间是一个新来的房间：
        // 或者交由自身调度后完成的状态标志-1
        if(typeof(canrunFlag[setData.room_id]) == 'undefined' || canrunFlag[setData.room_id] == -1){
            if(canrunFlag[setData.room_id] == -1){
                model.changedTemp(setData).then(function(){},
                    function(err){res.end(JSON.stringify({code:0, err:"changedTemp error: "+err}))});
                canrunFlag[setData.room_id] = true;
            }
            model.getPriority({room_id: setData.room_id, record_id: recordId[setData.room_id]}).then(function(data){
                // 当前空调进入调度队列
                var exitFlag = false;
                // 原sockTag中不存在的，才添加： 为了防止计时较短时多次添加sockTag的情况
                for(i=0; i<sockTag.length; i++)
                    if(sockTag[i].room_id == data.room_id)
                        exitFlag = true;
                if(!exitFlag){
                    //若运作队列中有小于3个的房间空调
                    if(sockTag.length<3){
                        // sockTag.push会影响sockTag.length的值，此处必须放到里面
                        sockTag.push({room_id:data.room_id, priority: data.priority});
                        imRecord[recordId[data.room_id]].serveStartTime = new Date().getTime();
                        canrunFlag[data.room_id] = true;
                        data.state = 1;
                        model.setState(data);
                        // 当前空调直接进入运行态，即服务器予以响应，但是不修改温度值
                        res.end(JSON.stringify({code:1, data: data}));
                    }
                    // 否则
                    else{
                        sockTag.push({room_id:data.room_id, priority: data.priority});
                        sockTag.sort(by("priority"));

                        for(var i = 0; i < 3; i++)
                        {
                            // 如果新来的空调成功进入运行队列，则
                            if(sockTag[i].room_id == data.room_id){
                               canrunFlag[data.room_id] = true;
                               imRecord[recordId[data.room_id]].serveStartTime = new Date().getTime();
                               data.state = 1;
                               model.setState(data);
                               // 被换出的房间出队列
                               canrunFlag[sockTag[3].room_id] = false;
                               // 存储被调出的房间的状态：
                               model.setState({room_id: sockTag[3].room_id, state: 3})
                               imRecord[recordId[sockTag[3].room_id]].scheduleCount++;
                               imRecord[recordId[sockTag[3].room_id]].serveTime = new Date().getTime()
                                - imRecord[recordId[sockTag[3].room_id]].serveStartTime;
                               // 空调进入运行态
                               res.end(JSON.stringify({code:1, data: data}));
                            }
                            else{
                                canrunFlag[data.room_id] = false;
                                res.end(JSON.stringify({code:3, data: data}));
                            }
                        }
                    }
                }
            }, function(err){ console.log("getPriority errror: "+err);});
        }
        // 如空调已经在服务范围内了
        // code: 1 正常运行态， code: 3 在调度处排队， code: -1 调度完成
        else{
            model.getPriority({room_id: setData.room_id, record_id: recordId[setData.room_id]}).then(function(data){
                // 每次执行数据变化前重新排列优先级：
                sockTag.sort(by("priority"));
                //只有当sockTag.length大于3时才需要调度
                if(sockTag.length>3)
                    for(var i = 0; i < 3; i++)
                        // 如果新来的空调成功进入运行队列，则
                        if(sockTag[i].room_id == data.room_id){
                           canrunFlag[data.room_id] = true;
                           imRecord[recordId[data.room_id]].serveStartTime = new Date().getTime();
                           data.state = 1;
                           model.setState(data);
                           // 被换出的房间出队列
                           canrunFlag[sockTag[3].room_id] = false;
                           // 存储被调出的房间的状态：
                           model.setState({room_id: sockTag[3].room_id, state: 3})
                           imRecord[recordId[sockTag[3].room_id]].scheduleCount++;
                           imRecord[recordId[sockTag[3].room_id]].serveTime = new Date().getTime()
                            - imRecord[recordId[sockTag[3].room_id]].serveStartTime;
                        }
                for(i=0; i<sockTag.length; i++){
                    if(sockTag[i].room_id == data.room_id){
                        // 如果处在运行态：
                        if(i < 3){
                            var setDataNext = changeValue(data);

                            if(Math.abs(setDataNext.temp - setDataNext.target) <= 0.05){
                                // 记录下当前有的服务时间：
                                imRecord[recordId[sockTag[i].room_id]].serveTime += new Date().getTime() - imRecord[recordId[sockTag[i].room_id]].serveStartTime;
                                // 删除运行态的该房间
                                sockTag.splice(i,1);
                                //让队列的下一个进入运行态：
                                if(sockTag.length >= 3){
                                    imRecord[recordId[sockTag[2].room_id]].serveStartTime = new Date().getTime();
                                    canrunFlag[sockTag[2].room_id] = true;
                                    // 存储变化后的状态：
                                    model.setState({room_id: sockTag[2].room_id, state: 1})
                                }
                                // 转为本地调度状态标志
                                canrunFlag[setDataNext.room_id] = -1;
                                // 返回值为待机态code = -1
                                // 房间状态改为待机：
                                setDataNext.state = 2;
                                model.setChange(setDataNext).then(function(data) {
                                    res.end(JSON.stringify({code:-1, data: data}));
                                }, function(err){ res.end(JSON.stringify({code:0, err:"run finished error: "+err}))});
                            }
                            else{
                                model.setChange(setDataNext).then(function(data) {
                                    res.end(JSON.stringify({code:1, data: data}));
                                }, function(err){ res.end(JSON.stringify({code:0, err:"run error: "+err}))});
                            }
                        }
                        // 否则就是调度中态
                        else{
                            model.getState({room_id: data.room_id}).then(function(data){
                                res.end(JSON.stringify({code:3, data:data}));
                            }, function(err){ res.end(JSON.stringify({code:0, err:"getState error: "+err}))});
                        }
                    }
                }
            });
        }
    });
});


roomController.post('/setTemp', function(req, res){
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
        model.setTemp(setData).then(function(data){
            imRecord[recordId[setData.room_id]].changeTempCount++;
            res.end(JSON.stringify({code:1, data: data}));
        }, function(err){ res.end(JSON.stringify({code:0, err: err}))});
    });
})

roomController.post('/setSpeed', function(req, res){
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
        model.setSpeed(setData).then(function(data){
            imRecord[recordId[setData.room_id]].changeSpeedCount++;
            model.getPriority({room_id: setData.room_id, record_id: recordId[setData.room_id]}).then(function(data){
                for(i=0; i<sockTag.length; i++){
                    if(sockTag[i].room_id == setData.room_id){
                        sockTag[i].priority = data.priority;
                    }
                }
            });
            res.end(JSON.stringify({code:1, data: data}));
        }, function(err){ res.end(JSON.stringify({code:0, err: err}))});
    });
})

// 房间空调调度结束，交由中央空调调度开始
// view: room_id, temp
// model: result = "ack"
// roomController.post('/changed',function(req,res){
//     res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
//     var postData = '';
//     req.setEncoding('utf8');
//     // 监听data事件：room_id, temp
//     req.addListener('data', function(postDataChunk){
//         postData += postDataChunk;
//     });
//     // 监听end事件：代表post数据结束
//     req.addListener('end', function(){
//         var changedData = JSON.parse(postData);    // 解析数据

//         model.changedTemp(changedData).then(function(){},
//             function(err){res.end(JSON.stringify({code:0, err:"changedTemp error: "+err}))});
//         model.getPriority({room_id: changedData.room_id, record_id: recordId[changedData.room_id]}).then(function(data){
//             // 当前空调进入调度队列
//             var exitFlag = false;
//             // 原sockTag中不存在的，才添加： 为了防止计时较短时多次添加sockTag的情况
//             for(i=0; i<sockTag.length; i++)
//                 if(sockTag[i].room_id == data.room_id)
//                     exitFlag = true;
//             if(!exitFlag){
//                 //若运作队列中有小于3个的房间空调
//                 if(sockTag.length<3){
//                     sockTag.push({room_id:data.room_id, priority: data.priority});
//                     model.setState(data);
//                     imRecord[recordId[data.room_id]].serveStartTime = new Date().getTime();
//                     canrunFlag[data.room_id] = true;
//                     data.state = 1;
//                     model.setState(data);
//                     // 当前空调直接进入运行态，服务器立即予以响应，但是不修改温度值
//                     res.end(JSON.stringify({code:1, data: data}));
//                 }
//                 // 否则
//                 else{
//                     sockTag.push({room_id:data.room_id, priority: data.priority});
//                     sockTag.sort(by("priority"));

//                     for(var i = 0; i < 3; i++)
//                     {
//                         // 如果新来的空调成功进入运行队列，则
//                         if(sockTag[i].room_id == data.room_id){
//                            canrunFlag[data.room_id] = true;
//                            data.state = 1;
//                            model.setState(data);
//                            imRecord[recordId[data.room_id]].serveStartTime = new Date().getTime();
//                            // 被换出的房间出队列
//                            canrunFlag[sockTag[3].room_id] = false;
//                            imRecord[recordId[sockTag[3].room_id]].scheduleCount++;
//                            imRecord[recordId[sockTag[3].room_id]].serveTime = new Date().getTime()
//                             - imRecord[recordId[sockTag[3].room_id]].serveStartTime;
//                            model.setState({room_id: sockTag[3].room_id, state: 2});
//                            // 空调进入运行态
//                            res.end(JSON.stringify({code:1, data: data}));
//                         }
//                         else{
//                             canrunFlag[data.room_id] = false;
//                             res.end(JSON.stringify({code:3, data: data}));
//                         }
//                     }
//                 }
//             }
//         });
//     });
// });


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
        var checkCostData = JSON.parse(postData);    // 解析数据？

        model.checkCost(checkCostData).then(function(data){
            res.end(data);
        });
    });
});

// 执行改变值的功能，由调度函数调用
function changeValue(data){
        var det;  // 增量因子  // speed 0,1,2

        if (data.temp < data.target)  // 暖
        {
            switch(data.speed)
            {
                case 0: det = 1.0/30; break;
                case 1: det = 0.05; break;  // 0.05度/6s
                case 2: det = 0.1; break;   // 0.1度/6s
                default : det = 0; break;
            }
        }
        else  // 冷
        {
            switch(data.speed)
            {
                case 0: det = -1.0/30; break; // 1/30度/6s
                case 1: det = -0.05; break;   // 0.05度/6s
                case 2: det = -0.1; break;    // 0.1度/6s
                default : det = 0; break;
            }
        }


        data.temp += det;
        data.cost += Math.abs(det);

        return data;
}

//by函数接受一个成员名字符串做为参数
//并返回一个可以用来对包含该成员的对象数组进行排序的比较函数
// @xiaofeng： 调整了排序为逆序排序
var by = function(name){
    return function(o, p){
        var a, b;
        if (typeof o === "object" && typeof p === "object" && o && p) {
            a = o[name];
            b = p[name];
            if (a === b) {
                return 0;
            }
            if (typeof a === typeof b) {
                return a > b ? -1 : 1;
            }
            return typeof a > typeof b ? -1 : 1;
        }
        else {
            throw ("error");
        }
    }
};

// 导出router作为一个模块，供app.js调用
module.exports = roomController;