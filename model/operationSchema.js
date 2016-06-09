// Operation : 房间的操作
var mongoose = require('./db.js');
var Schema = mongoose.Schema;

var operationSchema = new Schema({
    room_id : {type : Number, default: -1},
    ctime: {type: Date, default: Date.now},
    operation: {type: String, default: null}
});

module.exports = mongoose.model('operations', operationSchema);