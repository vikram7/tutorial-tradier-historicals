$(document).ready(function() {
  var thisUrlAsArray = window.location.href.split("/");
  var security = thisUrlAsArray[thisUrlAsArray.length - 1];
  var dynamicUrl = "http://localhost:4567/data/" + security;

  $.ajax({
    cache: false,
    type: "GET",
    url: dynamicUrl,
    dataType:'json',
    success: function(data) {
      var gains = [];
      var losses = [];

      for (var date in data) {
        if (data[date] >= 0 ) {
          gains.push([Date.parse(date), Math.round(100 * data[date])]);
        }
        else{
          losses.push([Date.parse(date), Math.round(100 * data[date])]);
        }
      }

      var sum = 0;
      for (i = 0; i < gains.length; i++) {
        sum = sum + gains[i][1];
      }
      var averageGain = sum / gains.length;

      var sum = 0;
      for (i = 0; i < losses.length; i++) {
        sum = sum + losses[i][1];
      }
      var averageLoss = sum / losses.length;

       $('#container').highcharts({
        chart: {
            type: 'scatter',
            zoomType: 'xy'
        },
        title: {
            text: 'The Five Best and Worst Performing Days for Ticker ' + security.toUpperCase()
        },
        subtitle: {
            text: 'Data Source: Tradier API, January 2010 to Current'
        },
        xAxis: {
            type: 'datetime'
        },
        yAxis: {
            title: {
                text: 'Return % (absolute value)'
            }
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
                    headerFormat: '',
                    pointFormat: '{point.x:%Y-%m-%d}: {point.y} %'
                }
            }
        },
        series: [{
            name: 'Average Loss: ' + averageLoss + '%',
            color: 'rgba(223, 83, 83, .5)',
            data: losses

        }, {
            name: 'Average Gain: ' + averageGain + '%',
            color: 'rgba(119, 152, 191, .5)',
            data: gains
        }]
    });
    },
    error: function() {
      alert("Sorry, something went wrong!")
    }
  });
});
