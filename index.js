var express = require('express');
const { EventEmitter } = require('stream');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;

var participantNum = 0;
var iineNum = 0;
var iinePerUnitTime = 0;

// @todo 部屋情報はどうやって管理するか
// 部屋情報は、部屋番号をキー、参加人数を値とする連想配列
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

// ダッシュボード（パスパラメータで部屋番号を受け取り）
app.get("/dashboard/:number", (req, res) => {
    roomNumber = req.params.number;
    console.log("dashboard:" + roomNumber);
    res.sendFile(__dirname + "/public/dashboard.html");
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

function point(date, iine) {
    const obj = {};
    obj.date = date;
    obj.iine = iine;
    return obj;
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
        io.to(socket.id).emit("chart", [Date.now(), 10]);
    });

    // いいね
    socket.on('iine', function () {
        iineNum++;
        iinePerUnitTime++;
        io.to(room).emit("iineNum", iineNum);
        // socket.broadcast.emit("iineNum", iineNum);
    });

    // 全期間チャート
    socket.on('getWholePeriodChart', () => {
        console.log("getWholePeriodChart: " + iineHistory.length);
        io.to(socket.id).emit("wholePeriodChart", iineHistory);
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

// iine時系列データ（Map(timestamp, iineNum)）
var iineHistory = [];
var ranking = [point(Date.now(), 0)];

setInterval(function () {
    if (iinePerUnitTime > 0) {
        let iine = point(Date.now(), iinePerUnitTime);
        console.log("chart," + iine.date + "," + iine.iine);
        io.sockets.emit("chart", iine);
        iineHistory.push(iine);
        // ランキング更新
        for (i=0; i<ranking.length; i++) {
            if (ranking[i].iine < iinePerUnitTime) {
                // 更新
                ranking.splice(i, 0, iine);
                if (ranking.length > 10) {
                    ranking.pop();
                }
                // ランキング出力
                // console.log("Updated ranking!");
                // for (j=0; j<ranking.length; j++) {
                //     console.log( j + ":" + ranking[j].date + ", " + ranking[j].iine)
                // }
                break;
            }
        }
        iinePerUnitTime = 0;
    }
}, 5000);

http.listen(port, () => console.log('listening on port ' + port));