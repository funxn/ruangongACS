var mongoose = require('mongoose');
var db = require('./db');
var Record = require('./recordSchema');
var Room = require('./roomSchema');

var model = new Object();

// hongdingyi:
var SWITCHONCODE = 1;
var SWITCHOFFCODE = 2;

// 调用model:存中央空调的初始化信息
// 中央空调初始化设置界面：mode，default_temp，min_temp, max_temp
model.initConfig = function(data){

}

model.insertData = function(data){
    var promise = new mongoose.Promise();
    Room.findOne(data,function(room){
            if(room){
                console.log(promise.resolve(err, room));
            }
            else
                Room.create(data, function(err, room){
                    if(err){
                        promise.resolve(err, {code: 0, msg: err});
                    }else{
                        promise.resolve(null, {code: 1, room: room});
                    }
                });
        });
    return promise;
};

model.switch = function(data){
    var promise = new mongoose.Promise();
	if(data.state>=0 && data.state<=2){
		Room.findOne(
            {room_id: data.room_id},
            // {$set: {status: data.state}},
            // {$set: {ctime: Date()}},
            // {safe: true, upsert: true, new : true},
            function(err, room){
                console.log("switch: " + room);
                if(room){
                    promise.resolve(null, JSON.stringify({code: 1, room: room}));
                }else{
                    promise.resolve(err, JSON.stringify({code: 0, msg: "room not exist!"}));
                }
        });
	} else{
		promise.resolve(err, JSON.stringify({code: 0, msg: "tag 不合法"}));
	}

    return promise;
};


// model.set = function(data){
//     if(data.state>=1 && data.state<=3){
//         Room.findOneAndUpdate(
//             {room_id: room_id},
//             {$set: {status: tag}},
//             {$set: {ctime: Date()}},
//             {safe: true, upsert: true, new : true},
//             function(err, room){
//                 console.log(room);
//                 if(room){
//                     return JSON.stringify({code: 1, user: null});                     // end函数中不能有undefined的变量，不然不会报错，且浏览器段持续                                                                   // POST error: net::ERR_EMPTY_RESPONSE
//                 }else{
//                     return JSON.stringify({code: 0, msg: "room not exist!"});
//                 }
//         });
//     } else{
//         return JSON.stringify({code: 0, msg: "tag 不合法"});
//     }
// };

module.exports = model;