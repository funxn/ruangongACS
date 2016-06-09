var express = require('express');
var model = require('../model/ops');  // ops数据库操作


var hotelController = express.Router();
hotelController.get('/',function(req,res){
    res.render('hotel');
});



// 酒店空调的使用/消费的报表
// 报表内容：(room_id, power, cost)

// 酒店管理员请求：查看日报表
hotelController.get('/dailyReport', function(req, res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
     model.genReport("daily").then(function(data){
        res.end(JSON.stringify({code: 1, data: data}));
    }, function(err){ res.end(JSON.stringify({code: 0, err: "genReport error: "+err}))});
});

// 酒店管理员请求：查看周报表
hotelController.get('/weeklyReport', function(req, res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
     model.genReport("weekly").then(function(data){
        res.end(JSON.stringify({code: 1, data: data}));
    }, function(err){ res.end(JSON.stringify({code: 0, err: "genReport error: "+err}))});
});

// 酒店管理员请求：查看月报表
hotelController.get('/monthlyReport', function(req, res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    model.genReport("monthly").then(function(data){
        res.end(JSON.stringify({code: 1, data: data}));
    }, function(err){ res.end(JSON.stringify({code: 0, err: "genReport error: "+err}))});
});

// 分析图~以后再说

// 导出router作为一个模块，供app.js调用
module.exports = hotelController;