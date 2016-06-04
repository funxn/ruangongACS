var mongoose = require('mongoose');
var app = require('express')();
var model = require('./ops');

var data = {
	room_id: 10,
	mode: 2
};

app.get('/', function(req, res){
	console.log(req.route);
    res.writeHead(200, {'Access-Control-Allow-Origin': '*'});

    model.insertData(data).then(function(room){
    	console.log(room);
    	res.end(JSON.stringify(room));
    });
});

app.listen(3000);