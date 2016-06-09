var mongoose = require('mongoose');
var db = require('./db');
var Record = require('./recordSchema');
var Room = require('./roomSchema');
var Operation = require(('./operationSchema'))

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

//找到record_id字段的最大值,如没找到默认RecordNum = 1;
if(!(RecordNum= Record.find().sort({rand:-1}).limit(1).record_id))
    RecordNum = 1;

console.log(RecordNum);

// 开关空调
model.switch = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {status: data.state, ctime: new Date().getTime(), temp: data.temp}},
        {safe: true, upsert: true, new : true},
        function(err, room){
            if(room){
            Room.findOne(
                {room_id: 0},
                function(err, cRoom){
                    if(err)
                        promise.resolve(err, null);
                    else{
                        // 对要返回的数据reData进行处理
                        var reData = {
                            room_id: room.room_id,
                            mode: room.mode,
                            temp: room.temp,
                            target: cRoom.target_temp,
                            speed: cRoom.speed,
                            min_temp: setM[cRoom.mode].min_temp,
                            max_temp: setM[cRoom.mode].max_temp,
                            state: room.status
                        };
                        promise.resolve(null, reData);
                    }
                });
            }else{
            Room.findOne(
                {room_id: 0},
                function(err, cRoom){
                    if(err)
                        promise.resolve(err, null);
                    else{
                        data.target_temp=cRoom.target_temp;
                        data.mode = cRoom.mode;
                        console.log("switch in: "+data);
                        Room.create(data, function(err, room){
                            if(err){
                                promise.resolve(err, null);
                            }else{
                                promise.resolve(null, room);
                            }});
                    }
                });
            }
    });
    return promise;
};

// 设置风速，温度
model.initSetting = function(data){
    var promise = new mongoose.Promise();
	Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {
            target_temp: data.target,
            speed: data.speed,
            ctime: Date()
        }},
        {safe: true, upsert: true, new : true},
        function(err, room){
            if(room){
                var reData = {
                    room_id: room.room_id,
                    mode: room.mode,
                    temp: room.temp,
                    target: room.target_temp,
                    speed: room.speed,
                    min_temp: setM[room.mode].min_temp,
                    max_temp: setM[room.mode].max_temp,
                    state: room.status
                };
                promise.resolve(null, reData);
            }else{
                promise.resolve(err, null);
            }
    });

    return promise;
};

// 设置温度：
model.setTemp = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {target_temp: data.target}},
        function(err, data){
        if(err){
            promise.resolve(err, null);
        }else{
            promise.resolve(null, data);
        }
    });
    return promise;
};
model.setSpeed = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {speed: data.speed}},
        function(err, data){
        if(err){
            promise.resolve(err, null);
        }else{
            promise.resolve(null, data);
        }
    });
    return promise;
}


model.checkCost = function(data){
    var promise = new mongoose.Promise();
    Room.findOne(
            {room_id: data.room_id},
            function(err, room){
                if(err){
                    promise.resolve(err, JSON.stringify({code: 0, msg: err}));
                }
                else if(room){
                    promise.resolve(null, JSON.stringify({code: 1, cost: room.cost}));
                }else{
                    promise.resolve(err, JSON.stringify({code: 0, msg: "cannot checkCost"}));
                }
        });

    return promise;
};

// 创建一条record记录：
model.newRecord = function(data){
    var promise = new mongoose.Promise();
    Record.create(
        {
            record_id: RecordNum++,
            room_id: data.room_id,
            //start_time: Date().getTime(),         // 数据库中已有Date.now和Date.now()
            end_temp: data.temp,
            power: data.cost
        },
        function(err, data){
            console.log("newRecord: "+RecordNum);
            if(err)
                promise.resolve(err, data);
            else
                promise.resolve(null, data);
        }
    );

    return promise;
}
// 对Record记录的修改
model.setRecord = function(data){
    Record.findOneAndUpdate(
        {record_id: data.record_id},
        {$set: {
                end_time: Date(),
                end_temp: data.temp,
                power: data.power}},
        {safe: true, upsert: true, new : true},
        function(err, record){
        if(err){
            console.log('setRecord error: '+err);
        }
    });
};

// 获取温度调控时初始的一些信息：
model.getPriority = function(data){
    var promise = new mongoose.Promise();
    Record.findOne(
            {record_id: data.record_id},
            function(err, record){
                if(err){
                    promise.resolve(err, JSON.stringify({code: 0, msg: err}));
                }
                else if(record){
                    Room.findOne(
                        {room_id: data.room_id},
                        function(err, room){
                            if(err)
                                promise.resolve(err, null);
                            else{
                                var reData = {
                                    cost: room.cost,
                                    priority: (room.ctime - record.start_time)*0.0000001 + room.speed,
                                    temp: room.temp,
                                    target: room.target_temp,
                                    speed: room.speed,
                                    room_id: room.room_id,
                                    state: room.status
                                }
                                promise.resolve(null, reData);
                            }
                        }
                    )
                }else{
                    promise.resolve(err, null);
                }
            }
        );
    return promise;
};
// 对于调度时修改保存的值的设置：
model.setChange = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {
            temp: data.temp,
            target_temp: data.target,
            speed: data.speed,
            status: data.state,
            cost: data.cost,
            ctime: Date()
        }},
        {safe: true, upsert: true, new : true},
        function(err, data){
            if(err){
                promise.resolve(err, null);
            }else{
                promise.resolve(null, data);
            }
    });
    return promise;
};

// 提供给/changed的专门改变温度的model：
model.changedTemp = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {temp: data.temp}},
        function(err, data){
        if(err){
            promise.resolve(err, null);
        }else{
            promise.resolve(null, data);
        }
    });
    return promise;
};
// 专门用于改变当前空调状态
model.setState = function(data){
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {status: data.state}},
        function(err,data){if(err){console.log("setState error: "+err);}}
    );
}
// room shutdown后，删除掉这个room的记录
model.delRoom = function(data){
    Room.remove(
        {room_id: data.room_id},
        function(err,data){
            if(err)
                console.log("delRoom error: "+err);
        }
    );
}



model.newOperation = function(data){
    Operation.create(data, function(err, data){
        if(err)
            console.log('newOperation error: '+err);
    });
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
// 调用model:存中央空调的初始化信息
// 中央空调初始化设置界面：mode，default_temp，min_temp, max_temp
model.initConfig = function(data){
    console.log(data);
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: 0},
        {$set: {
            mode: data.mode,
            ctime: Date(),
            target_temp: data.default_temp,
            fee: data.fee
            // min_temp: setM[data.mode].min_temp,
            // max_temp: setM[data.mode].max_temp
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

    return promise;
}
model.checkAir = function(){
    var promise = new mongoose.Promise();
    Room.find(
        {},
        function(err, data){
            if(data)
                promise.resolve(null, JSON.stringify({code:1, rooms: data}));
            else
                promise.resolve(err, JSON.stringify({code:0, str: err}));
        });
    return promise;
}


model.getCenterState = function(){
    var promise = new mongoose.Promise();
    Room.findOne(
        {room_id: 0},
        function(err, room){
            if(room){
                promise.resolve(null, room.status);
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