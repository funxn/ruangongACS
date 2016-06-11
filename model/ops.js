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

var RecordNum;

//找到record_id字段的最大值,如没找到默认RecordNum = 1; .limit(1).record_id
Record.find({}, function(err, records){
    console.log(records);
    RecordNum = 0;
    if(records){
        for(i=0; i<records.length; i++){
            if(records[i].record_id > RecordNum)
                RecordNum = records[i].record_id;
        }
    }

    console.log(++RecordNum);
});


// 开关空调
model.switch = function(data){
    var promise = new mongoose.Promise();
    Room.findOneAndUpdate(
        {room_id: data.room_id},
        {$set: {status: data.state, ctime: new Date().getTime(), temp:data.temp}},
        {safe: true, upsert: true, new: true},
        function(err, room){
            //若是为中央空调，直接返回
            if(room&&room.room_id == 0){
                promise.resolve(null, room);
            }
            else if(room){
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
                                state: room.status,
                                cost: room.cost,
                                fee: room.fee
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
                            data.fee = cRoom.fee;
                            data.cost = 0;
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
            ctime: new Date().getTime()
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
            start_time: new Date().getTime(),         // 数据库中已有Date.now和Date.now()
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
                end_time: new Date().getTime(),
                end_temp: data.end_temp,
                power: data.power,
                changeTempCount: data.changeTempCount,
                changeSpeedCount: data.changeSpeedCount,
                scheduleCount: data.scheduleCount,
                serveTime: data.serveTime
            }},
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
                                priority: (room.speed+1)*10 - record.serveTime*0.00000001,
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
            ctime: new Date().getTime()
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

//专门getRoomState的model：
model.getState = function(data){
    var promise = new mongoose.Promise();
    Room.findOne({room_id: data.room_id}, function(err, data){
        if(err)
            promise.resolve(err, null);
        else
            promise.resolve(null, data);
    });
    return promise;
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
//             {$set: {status: data.state, ctime: new Date().getTime(), mode: data.mode}},
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

/* 报表 */
model.genReport = function(opt){
    if(opt == "daily"){
        beginDate = new Date().getTime() - 24*60*60*1000;
    }else if(opt == "weekly"){
        beginDate = new Date().getTime() - 7*24*60*60*1000;
    }else if(opt == "monthly"){
        beginDate = new Date().getTime() - 30*24*60*60*1000;
    }

    var promise = new mongoose.Promise();
    Record.find(
        {start_time: {$gte: beginDate}},
        function(err, records) {
            if(err)
                promise.resolve(err, null);
            else{
                //显示
                    /*报表内容：
                        1.各房间占用中央空调的时长
                        2.各房间所消费的费用
                        3.各房间开关次数
                        4.各房间温度调节的次数
                        5.各房间风速调节的次数
                        6.各房间被调度的次数
                    */

                Room.findOne({room_id: 0}, function(err, data){
                    if(data){
                        var roomReport = [];  // 按房间统计
                        var fee = data.fee;  // TODO:获取费率
                        var inRoomRep = false;
                        for(var i=0; i<records.length; i++){
                            // 房间已经记录
                            for (var j = 0; j < roomReport.length; j++)
                            {
                                if (records[i].room_id == roomReport[j].room_id)
                                {
                                    roomReport[j].serveTime += records[i].serveTime;  // 服务总时长
                                    roomReport[j].cost += fee * records[i].power;   // 消费费用
                                    roomReport[j].switchCount++;                   // 开关次数
                                    roomReport[j].changeTempCount += records[i].changeTempCount;    // 温度调节的次数
                                    roomReport[j].changeSpeedCount += records[i].changeSpeedCount;  // 风速调节的次数
                                    roomReport[j].scheduleCount += records[i].scheduleCount;        // 被调度的次数
                                    inRoomRep = true;
                                    break;
                                }
                            }
                            // 房间未记录
                            if (inRoomRep == false)
                            {
                                roomReport.push({room_id:records[i].room_id,
                                                 serveTime: records[i].serveTime,
                                                 cost: fee * records[i].power,
                                                 switchCount: 1,
                                                 changeTempCount: records[i].changeTempCount,
                                                 changeSpeedCount: records[i].changeSpeedCount,
                                                 scheduleCount: records[i].scheduleCount
                                                });
                            }
                            else
                            {
                                inRoomRep = false;
                            }
                        }
                        promise.resolve(null, roomReport);
                    }
                });
            }
        }
    );
    return promise;
};



// 前台：查看账单——room_id,cost
model.genBill = function(data){
    var promise = new mongoose.Promise();
    Record.find(
        {room_id: data.room_id},
        function(err, records){
            if(err)
                promise.resolve(err, null);
            else{
                Room.findOne({room_id: 0}, function(err, centerData){
                    if (centerData){
                        var fee = centerData.fee;
                        var temp_power = 0;
                        for(i=0; i<records.length; i++)
                            temp_power += records[i].power;
                        promise.resolve(null, {room_id: data.room_id, cost: temp_power*fee});
                    }
                });
            }
        }
    );
    return promise;
};

// 前台：查看详单——room_id,power,cost
// 返回记录：TODO
model.genDetails = function(data){
    var promise = new mongoose.Promise();
    Record.find(
        {room_id: data.room_id},
        function(err, records){
            if(err)
                promise.resolve(err, null);
            else{
                Room.findOne({room_id: 0}, function(err, centerData){
                    if (centerData){
                        var fee = centerData.fee;
                        var temp_power = 0;
                        for(i=0; i<records.length; i++)
                            records.cost = records[i].power*fee;
                        promise.resolve(null, records);
                    }
                });
            }
        }
    );
    return promise;
};



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
            ctime: new Date().getTime(),
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