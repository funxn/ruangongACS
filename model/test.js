var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);


var sockTag = [null, null, null];
var sockFlag = [1, 1, 1];

app.get('/', function (req, res) {
  //res.sendfile(__dirname + '/test.html');
  sockTag[0]++;            // 可以使用room_id作为推送号统一起来
  res.end('room'+sockTag[0]);
});

sockTag[0] = 305;

// 事件监听器会在函数调用结束时被清除
// setInterval(function(){
//     for(var i=0; i<3; i++){
//         console.log(sockTag[i], sockFlag[i]);
//         if(sockTag[i] != null){
//             console.log("can go here!");
//             sockFlag[i] = 0;

// 因为异步调用function(socket){}, 此处不能使用for循环

function createSock(tag){
    io.on('connection', function (socket) {
    var temp = 0;
      socket.on('my'+tag, function (data) {
        console.log(data);
      });
      var t = setInterval(function(){
        temp += 1;
        socket.emit('room'+tag, { hello: temp });
        console.log(tag);
        if(temp > 100){
            clearInterval(t);
        }
      }, 1000);
    });
}

for(i=0; i<3; i++)
    createSock(sockTag[i]);
//         }
//     }
// }, 1000);



/*
var mongoose = require('mongoose');
var app = require('express')();
var model = require('./ops');
var io = require('socket.io').listen(8181);

var data = {
	room_id: 10,
	mode: 2
};

var tempObj = {
    socketIO: null,
    temp: null,
    target: null
}

// function changeTemp(){
//     tempObj.temp += 0.2;
//     tempObj.socketIO.emit('pushToWebClient', tempObj.temp);
//     t = setTimeout("changeTemp()", 1000);
//     if(tempObj.temp - tempObj.target < 1 && tempObj.target - tempObj.temp <1){
//         clearTimeout(t);
//     }
// }

var sockTag = [null, null, null];

var sockFlag = true;
setInterval(function(){
    if(sockTag[0] != null){
        io.sockets.on('connection', function (socketIO) {
            // 从客户端接收数据
            socketIO.emit(sockTag[0], "Hello");
            socketIO.on('fromWebClient', function (webClientData) {
                console.log("Client: "+webClientData);
            });
            // 客户端断开连接
            socketIO.on('disconnect', function () {
                console.log('DISCONNECTED FROM CLIENT');
            });
            // 向客户端发送数据
            tempObj.socketIO = socketIO;
            tempObj.target = 30;
            tempObj.temp = 25;
            var t = setInterval(function(){
                tempObj.temp += 0.2;
                tempObj.socketIO.emit(sockTag[0], tempObj.temp);
                if(tempObj.temp - tempObj.target < 1 && tempObj.target - tempObj.temp <1){
                    clearTimeout(t);
                    sockTag[0] = null;
                }
            }, 1000);
        });
    }
}, 1000);


app.post('/', function(req, res){
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

    var postData = '';
    var needPushing = false;
    req.setEncoding('utf8');
    // 监听data事件：代表有从客户端post过来的数据
    req.addListener('data', function(postDataChunk){
        postData += postDataChunk;
    });
    // 监听end事件：代表post数据结束
    req.addListener('end', function(){
        console.log("从客户端发过来的数据是："+postData);
        var data = JSON.parse(postData);
        model.switch(data).then(function(room){
            sockTag[0] = 'pushToWebClient';
            console.log(room);
            res.end(room);
        });
    });


});

app.listen(3000);

*/