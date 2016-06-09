var express = require('express');
var path = require('path');
var ejs = require('ejs');
var app = express();

// 控制器：以角色分配（严格点：以基本用例来写）
var routes = require('./routes/index.js');
var centerController = require('./routes/centerController');   // 中央空调管理员控制器
var roomController = require('./routes/roomController');	   // 房间空调控制器
// var counterController = require('./routes/counterController'); // 前台控制器
// var hotelController = require('./routes/hotelController');     // 酒店管理员

var mongoose = require('./model/db.js');

// routes
var routes = require('./routes/index');


app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// 以下定义路由处理的顺序：
app.use('/', routes);
app.use('/center', centerController);
app.use('/room',roomController);
// app.use('/counter',counterController);
// app.use('/hotel',counterController);



//app.engine('html', require('ejs').__express);
app.set('view engine', 'html');

// 以下定义路由处理的顺序：
app.use('/', routes);


// 添加错误处理代码:, --> 仅当前面有进行next()时
// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });
// // production error handler
// // no stacktraces leaked to user
// app.use(function(err, req, res, next) {
//   res.status(err.status || 500);
//   res.render('error', {
//     message: err.message,
//     error: {}
//   });
// });


//module.exports = app;
app.listen(3000);