var mongoose = require('mongoose');
var app = require('express')();
var model = require('./ops');

var data = {
	room_id: 10,
	mode: 2
};

app.post('/', function(req, res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

    var postData = '';
    req.setEncoding('utf8');
    // 监听data事件：代表有从客户端post过来的数据
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
        var data = JSON.parse(postData);
        model.insertData(data).then(function(room){
            console.log(room);
            res.end(JSON.stringify(room));
        });
    });

});

app.listen(3000);