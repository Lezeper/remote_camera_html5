
var gui = require('nw.gui');
var win = gui.Window.get();
//win.showDevTools();
//var audioSelect = document.querySelector("select#audioSource");
var videoSelect = document.querySelector("select#videoSource");
var camera_name;
var isCameraOpen = false;
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

function open_video(num){
    var cp = require('child_process');
    var process_video;
    if(num == 1){
        if(isCameraOpen) {
            document.getElementById('notice_openCamera').innerHTML = "video closing...";
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
            var username = document.getElementById('homepage_username').value;
            var exec_ = 'ffmpeg.exe -s 640x480 -f dshow -i video='+ camera_name + ' -f mpeg1video -b 800k -r 30 http://127.0.0.1:8082/12345/640/480/'+ username;
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
        },500);
    }else{
        document.getElementById('notice_openCamera').innerHTML = "video closing...";
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

win.on('close', function() {
    //open_video(0);
    alert("program will be closed!");
    this.close(true);
});

//win.close();