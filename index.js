// Websocket
var server = require('ws').Server;
var s = new server({port:5001});
var participantNum = 0;
var iineNum = 0;

s.on('connection',function(ws){
    participantNum++;
    console.log("paticipantNum = " + participantNum);
    s.clients.forEach(function(client){
        client.send("participantNum," + participantNum);
    });

    ws.on('message',function(message){
        // console.log("Received: "+message);
        iineNum++;
        s.clients.forEach(function(client){
            client.send("iineNum," + iineNum);
        });
    });

    ws.on('close',function(){
        console.log('I lost a client');
    });

});

// Express
var express = require('express');
var app = express();
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.listen(80, function() {

});