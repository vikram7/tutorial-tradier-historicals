$(document).ready(function() {
  var thisUrlAsArray = window.location.href.split("/");
  var security = thisUrlAsArray[thisUrlAsArray.length - 1];
  var dynamicUrl = "http://localhost:4567/" + security;

  $.ajax({
    cache: false,
    type: "GET",
    url: dynamicUrl,
    dataType:'json',
    success: function(data) {
       $('#container').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'Ticker: ' + security.toUpperCase()
        },
        subtitle: {
            text: 'Data Source: Tradier API'
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: 'Return (absolute value)'
            }
        },
        legend: {
            layout: 'vertical',
            align: 'left',
            verticalAlign: 'top',
            x: 100,
            y: 70,
            itemDistance: 30,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    radius: 10,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: '<b>{series.name}</b><br>',
                    pointFormat: '{point.x:%Y-%m-%d}: {point.y} %'
                }
            }
        },
        series: [{
            name: 'Loss',
            color: 'rgba(223, 83, 83, .5)',
            data: [[Date.UTC(2012, 06, 27), -12], [Date.UTC(2012, 04, 21), -11],
                   [Date.UTC(2012, 04, 29), -10], [Date.UTC(2012, 08, 24), -9],
                   [Date.UTC(2012, 04, 22), -9]]

        }, {
            name: 'Gain',
            color: 'rgba(119, 152, 191, .5)',
            data: [[Date.UTC(2012, 10, 26), 8], [Date.UTC(2012, 10, 14), 13],
                   [Date.UTC(2014, 0, 30), 14], [Date.UTC(2012, 9, 24), 19],
                   [Date.UTC(2013, 6, 25), 30]]
        }]
    });
    },
    error: function() {
      alert("Sorry, something went wrong!")
    }
  });
});
