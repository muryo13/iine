'use strict';

// 即時関数（ページ初期化）
(function () {
    // 部屋番号取得
    var subs = location.pathname.split('/');
    const roomNumber = subs[subs.length-1];
    console.log("Dashboard: " + roomNumber);
    document.getElementById("room-number").innerText = "@" + roomNumber;


    // グラフ初期化
    // chart.data.datasets[0].data.push({ date: Date.now(), iine: 0 });
    // chart.update();

    // websocket設定
    var socket = io();

    socket.on('connect', function () {
        console.log('Socket opened.');

        socket.emit("getWholePeriodChart", roomNumber);

        socket.on("wholePeriodChart", (msg) => {
            console.log(msg);
            const chart = new Chart(
                document.getElementById('wholePeriodChart'),
                {
                    type: 'bar',
                    data: {
                        datasets: [
                            {
                                data: msg,
                                fill: 'start',
                                lineTension: 0.1,
                                spanGaps: true,
                                backgroundColor: "coral"
                            },
                        ]
                    },
                    options: {
                        plugins: {
                            legend: {
                                display: false,
                            }
                        },
                        parsing: {
                            xAxisKey: 'date',
                            yAxisKey: 'iine'
                        },
                        scales: {
                            x: {
                                type: 'time',
                                time: {
                                    unit: 'second',
                                    displayFormats: {
                                        hour: 'hh:mm:ss',
                                    },
                                },
                            },
                            // yAxis: {
                            //     min: 0,
                            // }
                        },
                    },
                }
            );
                    chart.update();
        });
   });

})();