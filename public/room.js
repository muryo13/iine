'use strict';

// 即時関数（ページ初期化）
(function () {
    // 部屋番号取得
    var subs = location.pathname.split('/');
    const roomNumber = subs[subs.length-1];
    console.log("Checkin: " + roomNumber);
    document.getElementById("room-number").innerText = "@" + roomNumber;


    // グラフ初期化
    var chartData = { date: 0, iine: 0 };
    const config = {
        type: 'bar',
        data: {
            datasets: [
                {
                    data: [],
                    fill: 'start',
                    lineTension: 0.1,
                    spanGaps: true,
                    backgroundColor: "coral"
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
            parsing: {
                xAxisKey: 'date',
                yAxisKey: 'iine'
            },
            scales: {
                x: {
                    type: 'realtime',
                    realtime: {
                        refresh: 500,
                        onRefresh: chart => {
                            chart.data.datasets[0].data.push(chartData);
                            chartData = { date: 0, iine: 0 };
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
    myChart.data.datasets[0].data.push({ date: Date.now(), iine: 0 });
    myChart.update();

    // websocket設定
    var socket = io();
    var num = 0;

    socket.on('connect', function () {
        console.log('Socket opened.');

        socket.emit("join", roomNumber);

        // socket.emit("getWholePeriodChart", roomNumber);
        socket.on("wholePeriodChart", (msg) => {
            for (var i=0; i<msg.length; i++) {
                myChart.data.datasets[0].data.push(msg[i]);
            }
        });

        socket.on("iineNum", (msg) => {
            document.getElementById('allIineNum').innerText = msg;
        });

        socket.on("roomParticipantNum", (msg) => {
            document.getElementById('participantNum').innerText = msg;
        });

        socket.on("chart", (msg) => {
            // console.log(msg);
            chartData = msg;
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

        document.getElementById('dashboard').addEventListener('click', function (e) {
            console.log("push button.");
            location.href = '/dashboard/' + roomNumber;
        });
    });


})();

window.onpageshow = function(event) {
	if (event.persisted) {
		 window.location.reload();
	}
};