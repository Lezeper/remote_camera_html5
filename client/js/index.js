var WebSocket = require('ws');
var client_username;
var socket;
var haveCamera = false;
var set_defaultcamera;
var connectWith = "";

// check whether the user have camera or not
var gui = require('nw.gui');
var win = gui.Window.get();
//win.showDevTools();
//var audioSelect = document.querySelector("select#audioSource");

navigator.getUserMedia = navigator.getUserMedia ||
navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

function gotSources(sourceInfos) {
    for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement("option");
        option.value = sourceInfo.id;
        if (sourceInfo.kind === 'audio') {
            //option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
            //audioSelect.appendChild(option);
        } else if (sourceInfo.kind === 'video') {
            haveCamera = true;
            //document.getElementById("test").innerHTML = "a";
        }
    }
}

if (typeof MediaStreamTrack === 'undefined'){
    alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
} else {
    MediaStreamTrack.getSources(gotSources);
}



// some jquery effects
$(document).ready( function() {
    $("#wantStream").click( function() {
        $( "#asSource" ).slideToggle( "slow" );
    });
});

function usernameSubmit(){
    client_username = document.getElementById('username').value;
    if(client_username != null){
        // show username
        document.getElementById("please_login").style.display="none";
        // for showing
        document.getElementById('homepage_username').innerHTML = "Welcome!: " + client_username;
        // for calling
        document.getElementById('homepage_username').value = client_username;
        document.getElementById("connect_to_source").style.display="";
        document.getElementById("private_video_chat").style.display="";

        var client = new WebSocket( 'ws://127.0.0.1:8084/' );
        var player = new jsmpeg(client, {canvas:canvas});
    }

    // Connect to websocket server 
    socket = io.connect('ws://localhost:8085');

    // tell server username
    socket.emit('login', {username:client_username});

    // listening for login in
    socket.on('login', function(o){
        updateSysMsg(o, 'login');
    });

    // listening for login out 
    socket.on('logout', function(o){
        updateSysMsg(o, 'logout');
    });
	
	// source exit mesg
    socket.on('AnnounceSourceExit', function(o){
        alert("Source exit!");
		document.getElementById("homepage_body").style.display="none";
		document.getElementById("backToHomepage").style.display="none";
		document.getElementById("connect_to_source").style.display="";
		document.getElementById("connect_to_source").style.display="none";
    });

    socket.on('message', function(meg){
        if(meg != null){
            var param = meg.split("/");
            var sources_name = param[1];
            var onlineClients = param[0];
            //alert(param[1]);
            document.getElementById('available_sources').innerHTML = "avaliable source list: " + sources_name;
            document.getElementById('onlineClients_list').innerHTML = "onlineClients: " + onlineClients;
        }
    });
	
	// receive private connect require from others
    socket.on('allow_connect', function(mesg){
        // -1: no camera    1: denied     0: accept
        //document.getElementById("test").style.display="";
        var data = client_username + "/" + mesg + "/";
        document.getElementById('test').innerHTML = "user: " + mesg + " want to connect to your video";
        if(confirm("user: " + mesg + " want to connect to your video"))
        {
            if(haveCamera){
                //camera();
                open_video(1, '\"'+ "FULL HD 1080P Webcam" + '\"');
                socket.emit('feedback_allow_connect', data + "0");
                document.getElementById("test").innerHTML = "Connecting with " + mesg + "..."
                document.getElementById("homepage_body").style.display="";
                document.getElementById("backToHomepage").style.display="";
                document.getElementById("connect_to_source").style.display="none";
            }else{
                alert("you have no available camera!!");
                socket.emit('feedback_allow_connect', data + "-1");
            }
        }
        else
        {
            socket.emit('feedback_allow_connect', data + "1");
        }
    });
}

function private_connection(){
    var require_private_source = document.getElementById('private_chat_username').value;
    // connection client can not be self
    if(require_private_source != client_username){
        document.getElementById("check_private_source_exist").style.display="";
        // send the require source and YOUR name
        var sendData = require_private_source + "/" + client_username;
        socket.emit('require_private_source', sendData);

        socket.on('check_private_source_exist', function(mesg){
            // -1: no camera    1: denied     0: accept
            // source name + (accept or not)

            var params = mesg.split("/");
            if(params[1] == 0){
				connectWith = params[0] ;
                document.getElementById("test").innerHTML = "Connecting with " + params[0] + "...";
                document.getElementById("homepage_body").style.display="";
                document.getElementById("backToHomepage").style.display="";
                document.getElementById("connect_to_source").style.display="none";
                camera();
                open_video(1, "");
            }else{
                if(params[1] == 1){
                    alert(params[0] + " denied your request!");
                    document.getElementById("test").innerHTML = params[0] + " denied your request!"
                }else{
                    alert("source have no available camera!");
                    document.getElementById("test").innerHTML = params[0] + " have no available camera!"
                }
            }
        });
    }else{
        alert("connection client can not be self");
    }
}

function connect_to_source(){
    var require_source = document.getElementById('source_username').value;

    // require source can not be self
    if(require_source != client_username){
        document.getElementById("check_source_exist").style.display="";
        // send the require source and YOUR name
        var sendData = require_source + "/" + client_username;
        socket.emit('require_source', sendData);

        socket.on('check_source-exist', function(mesg){
            if(mesg == 0){
                document.getElementById("check_source_exist").innerHTML = "Connecting...";
                document.getElementById("homepage_body").style.display="";
                document.getElementById("backToHomepage").style.display="";
                document.getElementById("connect_to_source").style.display="none";
				connectWith = require_source;
				document.getElementById("test").innerHTML = "Connecting with " + require_source + "..."

            }else{
                if(mesg == 1){
                    document.getElementById("check_source_exist").innerHTML = "source denied your request!"
                }else{
                    document.getElementById("check_source_exist").innerHTML = "source not exist!"
                }
            }
        });
    }else{
        alert("require source can not be self");
    }
}

function updateSysMsg(o, action) {
    // Online User list
    var onlineUsers = o.onlineUsers;
    // the number of online User
    var onlineCount = o.onlineCount;
    // new user
    var user = o.user;

    // update user account
    var userhtml = '';
    var separator = '';
    for (key in onlineUsers) {
        if (onlineUsers.hasOwnProperty(key)) {
            userhtml += separator + onlineUsers[key];
            separator = '、';
        }
    }
}


var camera_name;
var isCameraOpen = false;
function camera(){
    var videoSelect = document.querySelector("select#videoSource");
    var isFirst = true;

    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function gotSources(sourceInfos) {
        for (var i = 0; i != sourceInfos.length; ++i) {
            var sourceInfo = sourceInfos[i];
            var option = document.createElement("option");
            option.value = sourceInfo.id;
            if (sourceInfo.kind === 'audio') {
                //option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
                //audioSelect.appendChild(option);
            } else if (sourceInfo.kind === 'video') {
                option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
                videoSelect.appendChild(option);
                if(isFirst){
                    var thisOpt = option.text;
                    var str=thisOpt.replace(/\([^\)]*\)/g,"");
                    var addQuote =str.replace(/(^\s*)|(\s*$)/g,"");
                    camera_name = '\"'+ addQuote + '\"';
                    isFirst = false;
                }
            } else {
                console.log('Some other kind of source: ', sourceInfo);
            }
        }
    }

    if (typeof MediaStreamTrack === 'undefined'){
        alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
    } else {
        MediaStreamTrack.getSources(gotSources);
    }


    function successCallback(stream) {
        window.stream = stream; // make stream available to console
    }

    function errorCallback(error){
        console.log("navigator.getUserMedia error: ", error);
    }

    function start(){
        var select = document.getElementById('videoSource');
        var currentOpt = select.options[select.selectedIndex];
        console.log(currentOpt)
    }

    videoSelect.onchange = function(){
        var curOpt=this.options[this.selectedIndex].text;
        var str=curOpt.replace(/\([^\)]*\)/g,"");
        var addQuote =str.replace(/(^\s*)|(\s*$)/g,"");
        camera_name = '\"'+ addQuote + '\"';
        console.log(camera_name);
    }

    win.on('close', function() {
        //open_video(0, "");
		backToHomepage();
        alert("program will be closed!");
        this.close(true);
    });
}

// (num: 0 means close, 1 means open), defaultCamera is ""
function open_video(num, defaultcamera){
    if(defaultcamera != ""){
        camera_name = defaultcamera;
    }
    var cp = require('child_process');
    var process_video;
    if(num == 1){
        if(isCameraOpen) {
			socket.emit('sourceExit', client_username);
            document.getElementById('notice_openCamera').innerHTML = "video closing...";
			connectWith = "";
            process_video = cp.exec('wmic process where name="ffmpeg.exe" call terminate',
                function (error, stdout, stderr) {

                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                        document.getElementById('notice_openCamera').innerHTML = error;
                    }
                });
        }
        setTimeout(function(){
            var exec_ = 'ffmpeg.exe -s 640x480 -f dshow -i video='+ camera_name + ' -f mpeg1video -b 800k -r 30 http://127.0.0.1:8082/12345/640/480/'+ client_username;
            console.log(exec_);
            document.getElementById('notice_openCamera').innerHTML = "Open video success!!";

            process_video = cp.exec(exec_,
                function (error, stdout, stderr) {
                    console.log('stdout: ' + stdout);
                    console.log('stderr: ' + stderr);
                    if (error !== null) {
                        console.log('exec error: ' + error);
                        document.getElementById('notice_openCamera').innerHTML = error;
                    }
                });
            isCameraOpen = true;
			
			setTimeout(function(){
				document.getElementById("homepage_body").style.display="";
				var sendData = client_username + "/" + client_username;
				socket.emit('require_source', sendData);
			},500);
			
        },500);
    }else{
		socket.emit('sourceExit', client_username);
        document.getElementById('notice_openCamera').innerHTML = "video closing...";
		connectWith = "";
        process_video = cp.exec('wmic process where name="ffmpeg.exe" call terminate',
            function (error, stdout, stderr) {
                console.log('stdout: ' + stdout);
                console.log('stderr: ' + stderr);
                if (error !== null) {
                    console.log('exec error: ' + error);
                    document.getElementById('notice_openCamera').innerHTML = error;
                }
            });
        isCameraOpen = false;
    }
}

function backToHomepage(){
	// close the local camera if you are soucer
	if(isCameraOpen){
		socket.emit('sourceExit', client_username);
		open_video(0, '');
	}else{
		// remove your name from server sender list
		if(connectWith != "")
		{
			socket.emit('delete_fromSender', client_username + "/" + connectWith);
		}
	}
	document.getElementById("test").style.display="none";
	document.getElementById("homepage_body").style.display="none";
	document.getElementById("backToHomepage").style.display="none";
	document.getElementById("connect_to_source").style.display="";
}

