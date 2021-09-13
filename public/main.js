'use strict';

(function () {
    var socket = io();
    var num = 0;

    socket.on('connect', function () {
        console.log('Socket opened.');

        socket.on('message', function (e) {
            console.log(e);
            let message = e;
            let words = message.split(',');
            if (words[0] == 'iineNum') {
                document.getElementById('allIineNum').innerText = words[1];
            } else if (words[0] == 'participantNum') {
                document.getElementById('participantNum').innerText = words[1];
            }
        });

    });

    document.addEventListener('DOMContentLoaded', function (e) {
        // サーバーにデータを送る
        document.getElementById('sample').addEventListener('click', function (e) {
            console.log("push button.");
            socket.emit("message", 'iine');
            document.getElementById("iineNum").innerText = ++num;
        });
    });
})();