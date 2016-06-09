var express = require('express');
var model = require('../model/ops');  // ops数据库操作


var counterController = express.Router();
counterController.get('/',function(req,res){
    res.render('counter');
});

// 前台请求：生成账单
// view: room_id
// model: room_id,cost
counterController.post('/genBill',function(req,res){
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

        var genBillData = JSON.parse(postData);

        model.genBill(genBillData).then(function(data){
            res.end(JSON.stringify({code:1, data: data}));
        },function(err){JSON.stringify({code:0, err: "getBill error: "+err});});
    });

});

// 前台请求：查看详单
// view: room_id
// model: room_id, power, coat, 时长？——get from统计详单(开关机次数，温控起止时间，温控起止温度，风量大小)
counterController.post('/genDetails',function(req,res){
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

        var genBillData = JSON.parse(postData);

        model.genDetails(genBillData).then(function(data){
            res.end(JSON.stringify({code:1, data: data}));
        },function(err){JSON.stringify({code:0, err: "getBill error: "+err});});
    });

});


// // 前台请求：生成账单
// // model: room_id,cost
// counterController.get('/genBill',function(req,res){
//     res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

//      model.genBill().then(function(data){
//         res.end(JSON.stringify(data));
//     });
// });

// // 前台请求：查看详单
// // model: room_id, power, coat, 时长？——get from统计详单(开关机次数，温控起止时间，温控起止温度，风量大小)
// counterController.get('/genDetails',function(req,res){
// 	res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

//     model.genBill().then(function(data){
//         res.end(JSON.stringify(data));
//     });
// });


// 导出router作为一个模块，供app.js调用
module.exports = counterController;