var client_username;
var socket;
function usernameSubmit(){
    client_username = document.getElementById('client_username').value;
    if(client_username != null){
        // show username
        document.getElementById("submit_name_div").style.display="none";
        document.getElementById('display_username_div').innerHTML = "Hello!: " + client_username;
        document.getElementById("connect_to_source").style.display="";
    }

    //连接websocket后端服务器
    socket = io.connect('ws://localhost:8085');

    //告诉服务器端有用户登录
    socket.emit('login', {username:client_username});

    //监听新用户登录
    socket.on('login', function(o){
        updateSysMsg(o, 'login');
    });

    //监听用户退出
    socket.on('logout', function(o){
        updateSysMsg(o, 'logout');
    });

    socket.on('message', function(meg){
        document.getElementById('avaliable_sources').innerHTML = meg;
    });
}

function connect_to_source(){
    var require_source = document.getElementById('source_username').value;
    var require_source_exist = false;

    socket.emit('require_source', require_source);
    socket.on('check_source-exist', function(mesg){
        if(mesg == "0"){
            require_source_exist = true;
        }else{
            require_source_exist = false;
        }
    });

    if(require_source_exist){
        console.log("require_source exist!");
        document.getElementById("displayVideo").style.display="";
    }else{
        alert("require_source no exist!");
    }
}

function updateSysMsg(o, action) {
    //当前在线用户列表
    var onlineUsers = o.onlineUsers;
    //当前在线人数
    var onlineCount = o.onlineCount;
    //新加入用户的信息
    var user = o.user;

    //更新在线人数
    var userhtml = '';
    var separator = '';
    for (key in onlineUsers) {
        if (onlineUsers.hasOwnProperty(key)) {
            userhtml += separator + onlineUsers[key];
            separator = '、';
        }
    }
}