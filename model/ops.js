var mongoose = require('mongoose');
var db = require('./db');
var Record = require('./recordSchema');
var Room = require('./roomSchema');

var model = new Object();

// hongdingyi:
var SWITCHONCODE = 1;
var SWITCHOFFCODE = 2;

// 设置制冷制热模式：
var setM = [
    {min_temp: 18,
     max_temp: 25},
    {min_temp: 25,
     max_temp: 30}
];

// 调用model:存中央空调的初始化信息
// 中央空调初始化设置界面：mode，default_temp，min_temp, max_temp
model.initConfig = function(data){
    var promise = new mongoose.Promise();
    if(data.state>=0 && data.state<=2){
        Room.findOneAndUpdate(
            {room_id: 0},
            {$set: {
                mode: data.model,
                ctime: Date(),
                target_temp: data.default_temp,
                min_temp: setM[data.model].min_temp,
                max_temp: setM[data.model].max_temp
                }
            },
            {safe: true, upsert: true, new : true},
            function(err, room){
                if(room){
                    promise.resolve(null, JSON.stringify({code: 1, room: room}));
                }else{
                    Room.create(data, function(err, room){
                        if(err){
                            promise.resolve(err, JSON.stringify({code: 0, msg: err}));
                        }else{
                            promise.resolve(null, JSON.stringify({code: 2, room: room}));
                        }
                    });
                }
        });
    } else{
        promise.resolve(null, JSON.stringify({code: 0, msg: "state 不合法"}));
    }

    return promise;
}


// 开关空调
model.switch = function(data){
    var promise = new mongoose.Promise();
    if(data.state>=0 && data.state<=2){
        Room.findOneAndUpdate(
            {room_id: data.room_id},
            {$set: {status: data.state, ctime: Date(), mode: data.model}},
            {safe: true, upsert: true, new : true},
            function(err, room){
                if(room){
                    // 对要返回的数据reData进行处理
                    var reData = {
                        model: room.mode,
                        temp: room.temp,
                        min_temp: setM[room.mode].min_temp,
                        max_temp: setM[room.mode].max_temp,
                        state: room.state
                    };
                    promise.resolve(null, JSON.stringify({code: 1, room: reData}));
                }else{
                    Room.create(data, function(err, room){
                        if(err){
                            promise.resolve(err, JSON.stringify({code: 0, msg: err}));
                        }else{
                            promise.resolve(null, JSON.stringify({code: 2, room: room}));
                        }
                    });
                }
        });
    } else{
        promise.resolve(null, JSON.stringify({code: 0, msg: "state 不合法"}));
    }

    return promise;
};

// 设置风速，温度
model.set = function(data){
    var promise = new mongoose.Promise();
	if(data.state>=0 && data.state<=2){
		Room.findOne(
            {room_id: data.room_id},
            {$set: {
                target_temp: data.target,
                speed: data.speed,
                ctime: Date()
            }},
            {safe: true, upsert: true, new : true},
            function(err, room){
                if(err){
                    promise.resolve(err, JSON.stringify({code: 0, msg: err}));
                }
                else if(room){
                    // 实时推送？？ 在这里设置吗？？
                }else{
                    promise.resolve(err, JSON.stringify({code: 0, msg: "cannot set"}));
                }
        });
	} else{
		promise.resolve(null, JSON.stringify({code: 0, msg: "state 不合法"}));
	}

    return promise;
};




// model.switch = function(data){
//     var promise = new mongoose.Promise();
//     if(data.state>=0 && data.state<=2){
//             console.log(data.state);
//         Room.findOneAndUpdate(
//             {room_id: data.room_id},
//             {$set: {status: data.state, ctime: Date(), mode: data.mode}},
//             {safe: true, upsert: true, new : true},
//             function(err, room){
//                 if(room){
//                     promise.resolve(null, JSON.stringify({code: 1, room: room}));
//                 }else{
//                     Room.create(data, function(err, room){
//                         if(err){
//                             promise.resolve(err, JSON.stringify({code: 0, msg: err}));
//                         }else{
//                             promise.resolve(null, JSON.stringify({code: 2, room: room}));
//                         }
//                     });
//                 }
//         });
//     } else{
//         promise.resolve(null, JSON.stringify({code: 0, msg: "tag 不合法"}));
//     }

//     return promise;
// };





/* 中央空调 */
model.getCenterState = function(){
    var promise = new mongoose.Promise();
    Room.findOne(
        {room_id: 0},
        function(err, room){
            if(room){
                promise.resolve(null, room.state);
            }else{
                promise.resolve(null, 0);
            }
        }
    );
    return promise;
}

model.setCenterState = function(data){
    Room.findOneAndUpdate(
        {room_id: 0},
        {$set: {status: data.state}},
        {safe: true, upsert: true, new : true},
        function(err, room){});
}

module.exports = model;