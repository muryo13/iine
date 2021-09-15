'use strict';

(function () {
    var chartData = {x:0,y:0};
    const config = {
        type: 'bar',
        data: {
            datasets: [
                {
                    label: 'データセット 1',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [8, 4],
                    fill: true,
                    data: []
                },
                // {
                //     label: 'データセット 2',
                //     backgroundColor: 'rgba(54, 162, 235, 0.5)',
                //     borderColor: 'rgb(54, 162, 235)',
                //     cubicInterpolationMode: 'monotone',
                //     fill: true,
                //     data: []
                // }
            ]
        },
        options: {
            plugins: {
                streaming: {
                    duration: 300000
                }
            },
            scales: {
                x: {
                    type: 'realtime',
                    realtime: {
                        delay: 1000,
                        refresh: 5000,
                        onRefresh: chart => {
                            chart.data.datasets[0].data.push({
                                x: Date.now(),
                                y: chartData[2]
                            });
                        }
                    }
                }
            }
        }
    }

    const myChart = new Chart(
        document.getElementById('myChart'), config
    );

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
            } else if (words[0] == 'chart') {
                console.log(words);
                chartData = words;
            }
        })
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