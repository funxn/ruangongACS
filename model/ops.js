var mongoose = require('mongoose');
var db = require('./db');
var Record = require('./recordSchema');
var Room = require('./roomSchema');

var model = new Object();

// hongdingyi:
var SWITCHONCODE = 1;
var SWITCHOFFCODE = 2;
//
model.doThing = function (){
	var willDoSomething = "will do something";
	return willDoSomething;
};

model.insertData = function(data){
    var promise = new mongoose.Promise();
    Room.findOne(data,function(room){
            if(room){
                console.log(room);
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

model.switch = function(tag, room_id){
	if(tag>=1 && tag<=3){
		Room.findOneAndUpdate(
            {room_id: room_id},
            {$set: {status: tag}},
            {$set: {ctime: Date()}},
            {safe: true, upsert: true, new : true},
            function(err, room){
                console.log(room);
                if(room){
                    return JSON.stringify({code: 1, user: null});                     // end函数中不能有undefined的变量，不然不会报错，且浏览器段持续                                                                   // POST error: net::ERR_EMPTY_RESPONSE
                }else{
                    return JSON.stringify({code: 0, msg: "room not exist!"});
                }
        });
	} else{
		return JSON.stringify({code: 0, msg: "tag 不合法"});
	}
};

module.exports = model;