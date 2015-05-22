var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//username + require source name
var oneToOne_dir = [];
// source user + user list
var require_thisSource_dir = [];
// data source + data
var data_dir = [];
var implete_dir = [];

if( process.argv.length < 3 ) {
	console.log(
		'Usage: \n' +
		'node stream-server.js <secret> [<stream-port> <websocket-port>]'
	);
	process.exit();
}

var STREAM_SECRET = process.argv[2],
	STREAM_PORT = process.argv[3] || 8082,
	WEBSOCKET_PORT = process.argv[4] || 8084,
	STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

//var width = 320,
//	height = 240;
var width = 640,
	height = 480;

// Websocket Server
var WebSocketServer = require('ws').Server
	, socketServer = new WebSocketServer({port: WEBSOCKET_PORT});
//var socketServer = new (require('ws').Server)({port: WEBSOCKET_PORT});
socketServer.on('connection', function(socket) {
	// Send magic bytes and video size to the newly connected socket
	// struct { char magic[4]; unsigned short width, height;}
	var streamHeader = new Buffer(8);
	streamHeader.write(STREAM_MAGIC_BYTES);
	streamHeader.writeUInt16BE(width, 4);
	streamHeader.writeUInt16BE(height, 6);
	socket.send(streamHeader, {binary:true});

	console.log( 'New WebSocket Connection ('+socketServer.clients.length+' total)' );

	socket.on('close', function(code, message){
		console.log( 'Disconnected WebSocket ('+socketServer.clients.length+' total)' );
	});
});

// for sources
var sources_name = [];
// username + socket
var onlineUsers = [];
var onlineUsers_list = [];
var onlineCount = 0;

// HTTP Server to accept incomming MPEG Stream
var streamServer = require('http').createServer( function(request, response) {
	var params = request.url.substr(1).split('/');
	width = (params[1] || 320)|0;
	height = (params[2] || 240)|0;
	request.name = params[3];

	if(sources_name.indexOf(request.name) == -1){
		//sources_name[request.name] = request.name;
		sources_name.push(request.name);
	}else{
		console.log("source user already exist");
	}

	if( params[0] == STREAM_SECRET ) {
		// update sources available div
		io.emit('message', onlineUsers_list + "/" + sources_name);

		require_thisSource_dir[request.name] = [];

		console.log(
			"source: " + request.name + ' Connected: ' + request.socket.remoteAddress +
			':' + request.socket.remotePort + ' size: ' + width + 'x' + height
		);
		request.on('data', function(data){
			socketServer.broadcast(data, {binary:true}, request.name);
		});
		request.on('close', function(data){
			delete require_thisSource_dir[request.name];
			delete data_dir[request.name];

			console.log("source: " + request.name + " disconnected!");
			for(var i=0,n=0;i<sources_name.length;i++){
				if(sources_name[i] == request.name){
					sources_name.splice(i,1);
				}
			}
			// update sources available div
			io.emit('message', onlineUsers_list + "/" + sources_name);
		});
	}
}).listen(STREAM_PORT);

/* this socket is use for connecting every clients and return the available sources.
 * in this part will use socket.io to create http server, consider it need not continual
 * two-way communication.
 */

io.on('connection', function(http_socket){

    //console.log('a user connected');

    //监听新用户加入
    http_socket.on('login', function(obj){
        //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
        http_socket.name = obj.username;
		// send available sources name and onlineClients to login user

		//检查在线列表，如果不在里面就加入
		if(onlineUsers_list.indexOf(obj.username) == -1) {
			// related to socketserver, it's not a smart method, but it's only way for next step

			// or you can let uid as property
			//onlineUsers[obj.username] = obj.username;
			//console.log("this will be the id of user: " + socketServer.clients.name);
			onlineUsers[obj.username] = http_socket;
			onlineUsers_list.push(obj.username);
			//console.log(onlineUsers_list);
			io.emit('message', onlineUsers_list + "/" + sources_name);
			//在线人数+1
			onlineCount++;
			console.log('Online count: ' + onlineCount);
		}

		//监听用户退出
		http_socket.on('disconnect', function(){

			//将退出的用户从在线列表中删除
			if(onlineUsers_list.indexOf(http_socket.name) != -1) {
				//退出用户的信息
				//var obj = {username:onlineUsers[http_socket.name]};
				var obj = http_socket.name;

				//删除
				delete onlineUsers[http_socket.name];
				onlineUsers_list.splice(onlineUsers_list.indexOf(http_socket.name),1);

				// send available sources name to users
				io.emit('message', onlineUsers_list + "/" + sources_name);

				//在线人数-1
				onlineCount--;

				console.log('Online count: ' + onlineCount);

				//向所有客户端广播用户退出
				//io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
				// if the user is a source then update source list
				if(sources_name.indexOf(obj)){
					io.emit('message', onlineUsers_list + "/" + sources_name);
				}
				console.log(obj+' disconnected!');
			}
		});

        //向所有客户端广播用户加入
        //io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
        console.log('user: ' + obj.username + ' connected!');
    });

    //监听用户发布聊天内容
    http_socket.on('message', function(obj){
        //向所有客户端广播发布的消息
        //io.emit('message', obj);
        console.log(obj.username+'说：'+obj.content);
    });

	http_socket.on('feedback_allow_connect', function(obj){
		// if this event active, that means this two guys are chatting one-by-one
		// source + client + (accept or not)
		// -1: no camera    1: denied     0: accept
		var params = obj.split("/");
		var socket = onlineUsers[params[1]];

		//console.log("source: " + params[0] + " " + params[2] + " user: " + params[1]);
		if(params[2] == 0){
			// once hand shake, note them as pair
			/* It SHOULD be a pair like a:b and b:a , consider the exit event*/
			oneToOne_dir[params[0]] = params[1];
			oneToOne_dir[params[1]] = params[0];
			//console.log("one-to-one: " + oneToOne_dir[params[0]] + " .");
		}
		socket.emit('check_private_source_exist', params[0] + "/" + params[2]);

	});

	http_socket.on('require_private_source', function(data){
		// if this event active, that means this two guys are chatting one-by-one
		var params = data.split('/');
		//require_dir[params[1]] = params[0];
		//console.log('sources_name: ' + sources_name);
		console.log("user: '" + params[1] + "' require to connect private source: " + params[0]);

		if(onlineUsers_list.indexOf(params[0]) != -1){
			//io.emit('check_source-exist', 0);
			//require_thisSource_dir[params[0]].push(params[1]);

			// send message to source user for accept or not
			var socket = onlineUsers[params[0]];
			socket.emit('allow_connect', params[1]);

		}else{
			io.emit('check_source-exist', -1);
		}
	});

	// client require to check require source whether exist
	http_socket.on('require_source', function(data){

		var params = data.split('/');
		//console.log('sources_name: ' + sources_name);
		console.log("user: '" + params[1] + "' require to connect source: " + params[0]);

		if(sources_name.indexOf(params[0]) != -1){
			io.emit('check_source-exist', 0);
			require_thisSource_dir[params[0]].push(params[1]);
			console.log(require_thisSource_dir);
		}else{
			io.emit('check_source-exist', -1);
		}
	});
	
	// delete user who have exit the video room from source sender
	http_socket.on('delete_fromSender', function(data){

		var params = data.split('/');
		require_thisSource_dir[params[1]].remove(params[0]);
		// update info
		console.log("user: " + params[0] + "exit from user: " + params[1] + "'s room." );
		console.log(require_thisSource_dir);
	});
	
	// video source exit, then announce to other connectors
	http_socket.on('sourceExit', function(data){
		if(oneToOne_dir[data] != null)
		{
			if(onlineUsers_list.indexOf(oneToOne_dir[data]) != -1){
				var socket = onlineUsers[oneToOne_dir[data]];
				socket.emit('AnnounceSourceExit', 0);
				delete oneToOne_dir[data];
			}
		}else{
			// I am a public source
			if(require_thisSource_dir[data] != null)
			{
				console.log("those client connect to this source: " + require_thisSource_dir[data]);
				for(var i = 0; i < require_thisSource_dir[data].length; i++)
				{	console.log("aaaa " + require_thisSource_dir[data][0]);
					var socket = onlineUsers[require_thisSource_dir[data][i]];
					socket.emit('AnnounceSourceExit', 0);
				}
				delete require_thisSource_dir[data];
			}
		}
	});

});

http.listen(8085, function(){
    console.log('listening on *:8085');
});


socketServer.broadcast = function(data, opts, source_username_) {
	//if(source_username_ == require_source_name){
	// who sent what data
	//console.log(require_thisSource_dir[source_username_]);

	//console.log(require_thisSource_dir[source_username_]);
	//console.log("source name: " + source_username_);
	//console.log("oneToOne_dir[source_username_]: " + oneToOne_dir[source_username_]);
	//console.log(oneToOne_dir);
	if(oneToOne_dir[source_username_] != undefined){
	// one-to-one
		//this.clients[onlineUsers_list.indexOf(source_username_)].send(data, opts);
		//console.log(oneToOne_dir[source_username_] + " " + source_username_);
		this.clients[onlineUsers_list.indexOf(oneToOne_dir[source_username_])].send(data, opts);
	}else{
		// for live online chat room
		for(var i in require_thisSource_dir[source_username_]){
			// if this user is still online
			if(onlineUsers_list.indexOf(require_thisSource_dir[source_username_][i]) != -1){
				if (this.clients[onlineUsers_list.indexOf(require_thisSource_dir[source_username_][i])].readyState == 1) {
					//console.log( 'Begin streaming to ('+client_name+') from source ' + require_source_name );
					//this.clients[socketServer2[client_name]].send(data, opts);
					//console.log("source_username_: " + source_username_ + "changchuang: " + onlineUsers_list.indexOf(require_thisSource_dir[source_username_][i])
					//+ "clients.length: " + this.clients.length);
					this.clients[onlineUsers_list.indexOf(require_thisSource_dir[source_username_][i])].send(data, opts);
				}
			}
		}
	}
};

// define array method to delete user
Array.prototype.remove=function(deleteName)
{	
　　for(var i = 0; i < this.length; i++)
	{
		console.log(this[i] + '/' + deleteName);
		if(this[i] == deleteName)
		{
			while(this[i+1] != null)
			{
				this[i] = this[i+1];
			}
			this.length -= 1;
		}
	}
}

console.log('Listening for MPEG Stream on http://127.0.0.1:'+STREAM_PORT+'/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:'+WEBSOCKET_PORT+'/');
