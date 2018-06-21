"use strict";
var express = require('express');
var socket = require('socket.io');
var fs = require('fs');
var CryptoJS = require("crypto-js");

var config=JSON.parse(fs.readFileSync('config.json'));

var person = [];
var history = [];
var history_num = config.history_num ;
var port = config.sever_port;
var backup = config.backup;
var backup_filename = config.backup_filename;

var app = express();
var server = app.listen(port);
var io = new socket(server);

app.use(express.static('node_modules'));
app.use('/static',express.static('public'));

app.get('/',  (req, res)  => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection',  (socket) => {
	var user = '';
	var backup_file = fs.readFileSync(backup_filename);
	var backup_msg= backup_file!='' ?  JSON.parse(backup_file) : [];
	var history = backup_msg.length<=history_num ? backup_msg : backup_msg.slice(backup_msg.length-history_num,backup_msg.length+history_num);

	socket.emit('history',history);
	io.sockets.emit('updatePerson', person);

	socket.on('sendMsg', (data) => {
		var obj = new Object();
		obj.content = data;
		obj.time = Now();
		obj.name = user;
		if (history.length==history_num) {
			history.shift();
		}
		if (backup) {
			backupMsg(backup_filename,obj);
		}
		history.push(obj);
		io.sockets.emit('news',obj);
	});

	socket.on('setUserName',(data) => {
		user = data;
		person.push(user);
		io.sockets.emit('updatePerson',person);
		io.sockets.emit('news',{content:user+'进入房间',time:Now(),name:'系统消息'});
	});

	socket.on('disconnect',  (socket) => {
	    	if (user!='') {
		person.forEach((value,index)=>{
			if (value===user) {
				person.splice(index,1);
			}
		});
		io.sockets.emit('news', {content: user + '离开房间', time: Now(), name: '系统消息'});
		io.sockets.emit('updatePerson', person);
		}
	});

});

function  Now() {
	var date = new Date();
	return  date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'  '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
}

function backupMsg(filename,obj) {
	var backup_file = fs.readFileSync(backup_filename);
	var msg= backup_file!='' ? JSON.parse(backup_file) : [];
	msg.push(obj);
	var str = '[\n'
	msg.forEach((value,index) =>{
		if (index!==0) {
			str+=',\n';
		}
		str += '  {\n    "name":"'+value.name+'",\n    "time":"'+value.time+'",\n    "content":"'+value.content+'"\n  }';
	} );
	str += '\n]';
	fs.writeFile(filename, str, (err) => {
		if (err) {
			console.log("fail write :" + arr +  "   "+Date() + "\n error:"+err);
		}
	});
}



