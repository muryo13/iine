var express = require('express');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;
const date = new Date();

var participantNum = 0;
var iineNum = 0;
var discreteIine = 0;

// @todo 部屋情報はどうやって管理するか
// 部屋情報は、部屋番号をキー値とする連想配列
var rooms = {};

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    // console.log(req);
    res.sendFile(__dirname + '/public/checkin.html');
});
app.use(express.urlencoded({ extended: true }));
app.get("/checkin/", (req, res) => {
    console.log(req.body);
    var room = Number(req.body.num1);
    res.sendFile(__dirname + "/public/room.html");
})

// チェックイン リクエスト（パスパラメータで部屋番号を受け取り）
app.get("/room/:number", (req, res) => {
    roomNumber = req.params.number;
    console.log(roomNumber);
    if (roomNumber in rooms) {
        // 部屋あり
        res.sendFile(__dirname + "/public/room.html");
        // 部屋番号はクライアントが指定してくるので知っているはず
    } else {
        // 部屋なし
        // 404エラーレスポンスを返す
        // 部屋が見つからない。初めてのアクセスか、すでに削除された場合
        // @todo チェックイン画面にリダイレクトするか、チェックイン画面で先にチェックしたい
        res.status(404);
        res.end('お部屋が見つかりませんでした。\nまだ作成されていないか、すでに削除済みの可能性があります。 : ' + req.path);
    }
})

// 新しくつくる リクエスト
// 作成に成功したら、お部屋にリダイレクト
app.get("/create/", (req, res) => {
    console.log("Request to create.");
    do {
        id = createId(5);
    } while (id in rooms);
    rooms[id] = 0;
    console.log("create: " + id);
    res.redirect('/room/' + id);
})

function createId( n ){
    var CODE_TABLE = "0123456789";
        // + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        // + "abcdefghijklmnopqrstuvwxyz";
    var r = "";
    for (var i = 0, k = CODE_TABLE.length; i < n; i++){
        r += CODE_TABLE.charAt(Math.floor(k * Math.random()));
	}
	return r;
}

function onConnection(socket) {

    var room = null;
    participantNum++;

    // Roomへ接続
    socket.on("join", (msg) => {
        room = msg;
        console.log("room: " + msg);
        socket.join(room);
        rooms[room]++;
        emitRoomParticipantNum(socket, room);
    });

    // いいね
    socket.on('iine', function () {
        iineNum++;
        discreteIine++;
        io.to(room).emit("iineNum", iineNum);
        // socket.broadcast.emit("iineNum", iineNum);
    });

    // 切断
    socket.on("disconnect", (reason) => {
        participantNum--;
        rooms[room]--;
        emitParticipantNum(socket);
        emitRoomParticipantNum(socket, room);
    });

    function emitParticipantNum(socket) {
        console.log("participantNum = " + participantNum);
        io.to(room).emit("participantNum", participantNum);
        // socket.broadcast.emit("participantNum", participantNum);          
    }

    function emitRoomParticipantNum(socket, room) {
        console.log("roomParticipantNum = " + rooms[room]);
        io.to(room).emit("roomParticipantNum", rooms[room]);
        // socket.broadcast.emit("participantNum", participantNum);          
    }
}

io.on('connection', onConnection);

setInterval(function () {
    // if (discreteIine > 0) {
    console.log("chart," + Date.now() + "," + discreteIine);
    io.sockets.emit("chart", [Date.now(), discreteIine]);
    // }
    discreteIine = 0;
}, 5000);

http.listen(port, () => console.log('listening on port ' + port));