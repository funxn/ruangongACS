// AC: Air Conditioner : 空调实体

var mongoose = require('./db.js');
var Schema = mongoose.Schema;

var roomSchema = new Schema({
	room_id: {type : Number, default: 0, index: true},
	mode: {type: Number, default: 0},                  // 制冷和制热模式
	target_temp: {type: Number, default: 0},
	cost: {type: Number, default: 0},
	speed: {type: Number, default: 0},
	temp: {type: Number, default: 0},
	status: {type: Number, default: 0},
	ctime: {type: Date, default: 0}
});

module.exports = mongoose.model('Room', roomSchema);