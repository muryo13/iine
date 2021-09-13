var express = require('express');
var app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http)
const port = process.env.PORT || 3000;

var participantNum = 0;
var iineNum = 0;

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

http.listen(port, () => console.log('listening on port ' + port));