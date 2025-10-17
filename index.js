var express = require('express');
const { EventEmitter } = require('stream');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;

var participantNum = 0;
var iineNum = 0;
var iinePerUnitTime = 0;
const defaultRoom = '1';

// @todo 部屋情報はどうやって管理するか
// 部屋情報は、部屋番号をキー、参加人数を値とする連想配列
var rooms = new Map();
rooms.set(defaultRoom, 0);  // デフォルトルーム

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

// デフォルトページ（デモ向けにデフォルトルームに案内する）
app.get('/', function (req, res) {
    // console.log(req);
    // res.sendFile(__dirname + '/public/checkin.html');
    res.redirect('/room/' + defaultRoom);
});

// チェックインページ
app.get("/checkin/", (req, res) => {
    console.log(req.body);
    var room = Number(req.body.num1);
    res.sendFile(__dirname + "/public/room.html");
})

// 入室（パスパラメータで部屋番号を受け取り）
app.get("/room/:number", (req, res) => {
    const roomNumber = req.params.number;
    console.log(roomNumber);
    console.log(rooms.keys());
    if (rooms.has(roomNumber)) {
        // 部屋あり
        res.sendFile(__dirname + "/public/room.html");
        // 部屋番号はクライアントが指定してくるので知っているはず
    } else {
        // 部屋なし
        // 404エラーレスポンスを返す
        // 部屋が見つからない。初めてのアクセスか、すでに削除された場合
        // @todo チェックイン画面にリダイレクトするか、チェックイン画面で先にチェックしたい
        res.status(404);
        res.end('お部屋が見つかりませんでした : ' + req.path);
    }
})

// ダッシュボード（パスパラメータで部屋番号を受け取り）
app.get("/dashboard/:number", (req, res) => {
    const roomNumber = req.params.number;
    console.log("dashboard:" + roomNumber);
    res.sendFile(__dirname + "/public/dashboard.html");
})

// 新しくつくる リクエスト
// 作成に成功したら、お部屋にリダイレクト
app.get("/create/", (req, res) => {
    const roomNumber = req.params.number;
    console.log("Request to create " + roomNumber);
    let id;
    do {
        id = createId(5);
    } while (rooms.has(id));
    rooms.set(id, 0);
    console.log("create: " + id);
    res.redirect('/room/' + id);
})

function createId(n) {
    var CODE_TABLE = "0123456789";
    // + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    // + "abcdefghijklmnopqrstuvwxyz";
    var r = "";
    for (var i = 0, k = CODE_TABLE.length; i < n; i++) {
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

// iine時系列データ（Map(timestamp, iineNum)）
var iineHistory = [];
var ranking = [point(Date.now(), 0)];

function onConnection(socket) {

    var room = null;
    participantNum++;

    // Roomへ接続
    socket.on("join", (msg) => {
        room = msg;
        console.log("room: " + msg);
        socket.join(room);
        rooms.set(room, rooms.get(room) + 1);
        emitRoomParticipantNum(socket, room);
        io.to(socket.id).emit("wholePeriodChart", iineHistory);
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

    // ランキング
    socket.on('getRanking', (msg) => {
        console.log("getRanking");
        io.to(socket.id).emit("ranking", ranking);
    });

    // 切断
    socket.on("disconnect", (reason) => {
        participantNum--;
        rooms.set(room, rooms.get(room)-1);
        emitParticipantNum(socket);
        emitRoomParticipantNum(socket, room);
    });

    function emitParticipantNum(socket) {
        console.log("participantNum = " + participantNum);
        io.to(room).emit("participantNum", participantNum);
        // socket.broadcast.emit("participantNum", participantNum);          
    }

    function emitRoomParticipantNum(socket, room) {
        console.log("roomParticipantNum = " + rooms.get(room));
        io.to(room).emit("roomParticipantNum", rooms.get(room));
        // socket.broadcast.emit("participantNum", participantNum);          
    }
}

io.on('connection', onConnection);


setInterval(function () {
    if (iinePerUnitTime > 0) {
        let iine = point(Date.now(), iinePerUnitTime);
        console.log("chart," + iine.date + "," + iine.iine);
        io.sockets.emit("chart", iine);
        iineHistory.push(iine);
        // ランキング更新
        for (let i = 0; i < ranking.length; i++) {
            if (ranking[i].iine < iinePerUnitTime) {
                // 更新
                ranking.splice(i, 0, iine);
                if (ranking.length > 10) {
                    ranking.pop();
                }
                // ランキング出力
                // console.log("Updated ranking!");
                // for (let j=0; j<ranking.length; j++) {
                //     console.log( j + ":" + ranking[j].date + ", " + ranking[j].iine)
                // }
                break;
            }
        }
        iinePerUnitTime = 0;
    }
}, 5000);

http.listen(port, () => console.log('listening on port ' + port));
