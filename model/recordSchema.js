// Customer : 顾客实体

var mongoose = require('./db.js');
var Schema = mongoose.Schema;

var recordSchema = new Schema({
	record_id : {type : Number, default: 0, index: true},
	room_id : {type : Number, default: 0, unique: true},
	start_time: {type: Number, default: 25},
	end_time: {type: Number, default: 0},
	start_temp: {type: Number, default: 25},
	end_temp: {type: Number, default: 0},
	power: {type: Number, default: 0}
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


