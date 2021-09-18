var express = require('express');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;
const date = new Date();

var participantNum = 0;
var iineNum = 0;
var discreteIine = 0;

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

function onConnection(socket) {

    var room = null;
    participantNum++;
    
    // Roomへ接続
    socket.on("join", (msg) => {
        room = msg;
        console.log("room: " + msg);
        socket.join(room);
        emitParticipantNum(socket);
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
        emitParticipantNum(socket);
    });

    function emitParticipantNum(socket) {
        console.log("participantNum = " + participantNum);
        io.to(room).emit("participantNum", participantNum);
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