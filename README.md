<h2>What is it</h2>
Remote Webcam using NodeJS, Html5, Javascript, Node-Webkit.
<h2>Functions</h2>
1. if the source user force exit, then close his camera and update source list.<br>
2. source provider can accept or denied request.<br>
3. user can connect to source by typing source user name.<br>
4. online room list the available video source, user name, (news).<br>
5. server know who connected whatever the source or client, and who disconnected, keep updating.<br>
6. source provider also as a client user, so that means their home page should
be integrated. list the function in the homepage.<br>
7. simple text message function.<br>
8. source provider can choose switch their camera by camera name and click "open video".
(don't need to close). In case, also provided close button to close it manually. <br>
9. you have 2 choice to watch the video, one is 'private video chat' which means one-to-one 
video chat, the other is 'live video zone' which can watch the source with many clients together.<br>
10. It do not require have camera when you not a sourcer, so the program will check whether you
have camera first. Also, in private video chat, it should check whether the user have camera.

<h2>Process map</h2>
In this demo online video chat, the homepage(also as user page) will combine video watcher and
video "sourcer". The port 8085 will listening for all the user are login. 8082 port will active
when the user wanto as a video source. When the server accept the streaming, the 8082 http socket 
server will catch that, then use 8084 web socket server to broadcast to every clients.

<h2>NOTES:</h2>
8084 port is for jmpeg.js to show draw video on canvas, due to I can't understand what's going
on in this script, so I will leave it alone. In server, this port is recive streaming from other
http server and broadcast to every clients. (as websocket server)<br>

8082 port is a stream port to accept incoming MPEG stream. In older version, the 8084 websocket
will "stolen" the streaming from this 8082 http socket when the streaming is coming. In this 
port, will catch the source username by the url they are sending.<br>

8085 port is a http socket (socket.io module), this port is created for listening the user who 
are trying login and put them to the map in the server. When the user connected, the server will
use this port to return the available source lists.<br>
