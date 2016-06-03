var express = require('express');
var model = require('../model/ops');  // ops数据库操作


var counterController = express.Router();
counterController.get('/',function(req,res){
    res.render('counter');
});

counterController.get('/genBill',function(req,res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    res.end(model.genBill());
});

counterController.get('/genDetails',function(req,res){
	res.writeHead(200, {'Access-Control-Allow-Origin': '*'});
    res.end(model.genDetails());
});



// 导出router作为一个模块，供app.js调用
module.exports = counterController;