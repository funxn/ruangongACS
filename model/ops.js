// 实现各角色对数据库的操作
var express = require('express');
var Room = require('./roomSchema');
var Record = require('./recordSchema');


//
function doThing(postData){
	console.log(JSON.parse(postData));
	Room.findOne(JSON.parse(postData)).then(function(name){
	    if(name)
	        //return JSON.stringify({code: 1, name: name};
	       	return 1;
	});

//	return [JSON]
}