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
    participantNum++;
    emitParticipantNum(socket);

    socket.on('message', function (msg) {
        // console.log(msg);
        iineNum++;
        discreteIine++;
        socket.emit("message", "iineNum," + iineNum);
        socket.broadcast.emit("message", "iineNum," + iineNum);
    });

    socket.on("disconnect", (reason) => {
        participantNum--;
        emitParticipantNum(socket);
    });

    function emitParticipantNum(socket) {
        console.log("participantNum = " + participantNum);
        socket.emit("message", "participantNum," + participantNum);
        socket.broadcast.emit("message", "participantNum," + participantNum);          
    }
}

io.on('connection', onConnection);

setInterval(function () {
    console.log("chart," + Date.now() + "," + discreteIine);
    io.sockets.emit("message", "chart," + Date.now() + "," + discreteIine);
    discreteIine = 0;
}, 5000);

http.listen(port, () => console.log('listening on port ' + port));