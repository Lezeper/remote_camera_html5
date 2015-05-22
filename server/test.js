var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var clients = [];

server.listen(8888);

io.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  socket.on('login', function (data) {
    clients[data] = socket;
  });
  socket.on('test', function (data) {
	var s = clients["a"];
	s.emit('news', data);
  });
  
});