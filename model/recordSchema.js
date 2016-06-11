// Record : 对房间操作的记录

var mongoose = require('./db.js');
var Schema = mongoose.Schema;

/*
报表内容：
	1.各房间占用中央空调的时长
	2.各房间所消费的费用
	3.各房间开关次数
	4.各房间温度调节的次数
	5.各房间风速调节的次数
	6.各房间被调度的次数
*/

var recordSchema = new Schema({
	record_id : {type : Number, default: 0},
	room_id : {type : Number, default: -1},
	start_time: {type: Number, default: 0},
	end_time: {type: Number, default: 0},
	start_temp: {type: Number, default: 25},
	end_temp: {type: Number, default: 0},
	power: {type: Number, default: 0},
	changeTempCount: {type:Number,default:0},
	changeSpeedCount: {type:Number,default:0},
	scheduleCount:{type:Number,default:0},
	serveTime: {type:Number,default:0}
});

// var User = mongoose.model('CUS', cusSchema);

// 添加mongoose中的中间件： 实现做额外的自定义事件处理
// 这里实现修改editTime
// User.schema.pre('create', function(next){
//	var user = this;
//	user.editTime = new Date();
//	next();
// });

module.exports = mongoose.model('Record', recordSchema);


