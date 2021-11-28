'use strict';

// 即時関数（ページ初期化）
(function () {
    // 部屋番号取得
    var subs = location.pathname.split('/');
    const roomNumber = subs[subs.length-1];
    console.log("Checkin: " + roomNumber);
    document.getElementById("room-number").innerText = "@" + roomNumber;


    // グラフ初期化
    var chartData = { x: 0, y: 0 };
    const config = {
        type: 'bar',
        data: {
            datasets: [
                {
                    data: [],
                    fill: 'start',
                    lineTension: 0.1,
                    spanGaps: true,
                },
            ]
        },
        options: {
            plugins: {
                streaming: {
                    duration: 300000
                },
                legend: {
                    display: false
                },
            },
            scales: {
                x: {
                    type: 'realtime',
                    realtime: {
                        delay: 1000,
                        refresh: 5000,
                        onRefresh: chart => {
                            chart.data.datasets[0].data.push(chartData);
                            chartData = { x: 0, y: 0 };
                        }
                    }
                },
            },
            stepped: true
        },
    }

    Chart.defaults.scales.linear.min = 0;
    // Chart.defaults.scales.linear.max = 10;
    const myChart = new Chart(
        document.getElementById('myChart'), config
    );
    myChart.data.datasets[0].data.push({ x: Date.now(), y: 0 });
    myChart.update();

    // websocket設定
    var socket = io();
    var num = 0;

    socket.on('connect', function () {
        console.log('Socket opened.');

        socket.emit("join", roomNumber);

        socket.on("history", (msg) => {
            chartData = { x: msg[0], y: msg[1]};
        });

        socket.on("iineNum", (msg) => {
            document.getElementById('allIineNum').innerText = msg;
        });

        socket.on("roomParticipantNum", (msg) => {
            document.getElementById('participantNum').innerText = msg;
        });

        socket.on("chart", (msg) => {
            // console.log(msg);
            chartData = { x: msg.date, y: msg.iine };
            console.log(chartData);
        });
    });

    document.addEventListener('DOMContentLoaded', function (e) {
        // サーバーにデータを送る
        document.getElementById('iineNum').addEventListener('click', function (e) {
            console.log("push button.");
            socket.emit("iine");
            document.getElementById("iineNum").innerText = ++num;
        });
    });


})();