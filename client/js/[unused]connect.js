
var client_username = document.getElementById('client_username').value;
var WebSocket = require('ws'),
    conn_server_socket = new WebSocket( 'ws://127.0.0.1:8085/' );

conn_server_socket.on('open', function() {
    conn_server_socket.send(client_username);
    console.log("client connect to serever successfully!");
});

conn_server_socket.on('message', function(message) {
    console.log('Online username: : %s', message);
});

function connect_source(){
    var source_username = document.getElementById('source_username').value;
    client_username = document.getElementById('client_username').value;
    var send_data = source_username + '/' + client_username;

    conn_server_socket.send(send_data);
    console.log("send data from client " + source_username + " " + client_username);

}

/*

 // Show loading notice
 var canvas = document.getElementById('videoCanvas');
 var ctx = canvas.getContext('2d');
 ctx.fillStyle = '#444';
 ctx.fillText('Loading...', canvas.width/2-30, canvas.height/3);

 // Setup the WebSocket connection and start the player
 var client = new WebSocket( 'ws://localhost:8084/' );
 var player = new jsmpeg(client, {canvas:canvas});*/
