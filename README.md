##Introduction

When I actively traded options in stocks around earnings events, stocks that had the *potential for meaningful volatility*<sup>1</sup> in an upcoming earnings event were the most interesting. I tended to play [straddles](http://www.investopedia.com/terms/s/straddle.asp) and [strangles](http://www.investopedia.com/terms/s/strangle.asp) around stocks that I expected to this kind of meaningful volatility. If they had the potential to be up or down significantly, I found them interesting. Some worked and many didn't, but the plays that worked meaningfully overwrote the costs of the ones that didn't, resulting in a profitable strategy.

I'd often look at Bloomberg's `EE` function to determine whether or not a trade would be worth putting on:

![alt](http://i.imgur.com/b4Cc5rL.png)

In addition to the above data, `EE` would provide past percentage moves following an earnings event for a company. If AAPL had a fantastic earnings event in the past it might move +8% afterwards. If TWTR had a horrendous earnings event (like recently), it might be move -27%. Conversely, some stocks like GE or F might not move a lot around earnings. Understanding how much a stock had moved in the past is an essential part of determining whether or not a future options trade is worth putting on.

Now that I don't have Bloomberg anymore, I wanted to see if there was an easy way to get similar data. While not exactly the same, I was able to get historical stock data to determine the largest positive and negative returns of a stock over the last five years using the [Tradier API](https://developer.tradier.com/). Finding out those returns would serve as a reasonable proxy for determining a stock's ability to move around earnings.

After hooking up to the Tradier API in Ruby with a [Sinatra](www.sinatrarb.com) server and getting the data visualized with [Highcharts](https://www.highcharts.com) using a bit of Javascript and AJAX, I found that I could have a feature similar to what I had been using before as a professional trader:

####AAPL

![alt](http://i.imgur.com/Kt6DA9C.png)

####TWTR

![alt](http://i.imgur.com/KPcEDcs.png)

This tutorial will cover how to build a similar tool using the Tradier API.

###How we'll get there
* First we'll take a look at the [Tradier API](https://developer.tradier.com/).
* Next, we'll write Ruby code to get historical data for a stock in a Sinatra server.
* Then, we'll calculate the largest five moves in both directions for a particular stock and return it to our front end.
* Finally, we'll implement an AJAX request to get those moves and push them into a [Highcharts](https://www.highcharts.com) scatter plot using Javascript.

<sup>1</sup> *Potential for meaningful volatility* here means stocks that have some likelihood of having a percentage move that would differ meaningfully from prior percentage moves around an earnings event. If, on average, stock XYZ had moved around 5% and I, based on whatever research I had put together, expected the stock to move 10%, I would consider that 10% to be *meaningfully volatile*.

##Using the Tradier API
[Tradier](https://www.tradier.com) is a modern stock brokerage that differs in a really important way by offering an API that I think will help modernize and accelerate the brokerage and stock analysis industry. They offer the following:

```
[A] REST-based, truly open and secure API that delivers trading, real-time market data, and simple, seamless account opening and funding for investors, advisors, and traders.
```

What we care about in this tutorial is the vast amount of historical data that Tradier offers through its API. [A brief interlude about how difficult it would be for average investors to have access to this kind of stuff in the past]

I won't get into any details about how to get a Tradier API key, but if you click [Sign Up](https://developer.tradier.com/user/sign_up) on their Developer page, you'll be able to fill out some details to get access to their Sandbox, which gets you admission to their data through their API. Once you have an API key, you'll be able hit their API for the data you want. Make sure to store it in a `.env` file. The Github [repo](https://github.com/vikram7/tutorial-tradier-historicals) has a `.env.example` file to reflect what yours should look like. Also run `source .env` from your command line to make sure the API token is in your environment variable.

<sub>By the way, there is a Tradier Ruby [gem](https://github.com/tradier/tradier.rb), but I haven't looked into it that closely. This tutorial will outline how to hit the API directly rather than through a wrapper.</sub>

###Getting the Data

Let's take on something small first just to make sure we're able to hit the API. Say we want to grab AAPL quote data. According to the docs, the endpoint we care about is the following one:

```
"https://sandbox.tradier.com/v1/markets/quotes?symbols=AAPL"
```

We can hit that API endpoint in Tradier's sandbox and hopefully we'll get back the latest quote data on AAPL. Try running the following Ruby code in `pry` or `IRB`:

```ruby
require 'uri'
require 'net/https'
require 'json'

uri = URI.parse("https://sandbox.tradier.com/v1/markets/quotes?symbols=AAPL")
http = Net::HTTP.new(uri.host, uri.port)
http.read_timeout = 30
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_PEER
request = Net::HTTP::Get.new(uri.request_uri)
request["Accept"] = "application/json"
request["Authorization"] = "Bearer " + ENV["TOKEN"]
underlying_data = http.request(request)
```

If we look at `underlying_data`, we see the following response:

```ruby
=> #<Net::HTTPOK 200 OK readbody=true>
```

Let's call the response body and see what that looks like:

```ruby
underlying_data.body
=> "{\"quotes\":{\"quote\":{\"symbol\":\"AAPL\",\"description\":\"Apple Inc\",\"exch\":\"Q\",\"type\":\"stock\",\"last\":127.62,\"change\":2.36,\"change_percentage\":1.8900000000000001,\"volume\":55550382,\"average_volume\":52807718,\"last_volume\":0,\"trade_date\":1431116100000,\"open\":126.68,\"high\":127.62,\"low\":126.11,\"close\":127.62,\"prevclose\":125.26,\"week_52_high\":134.54,\"week_52_low\":82.904285,\"bid\":102.03,\"bidsize\":1,\"bidexch\":\"Q\",\"bid_date\":1431129600000,\"ask\":127.59,\"asksize\":0,\"askexch\":\"Q\",\"ask_date\":1431129600000,\"root_symbols\":\"AAPL,AAPL7\"}}}"
```

That's definitely more readable, but we can do better. We need to parse this response as JSON with the following line of code:

```ruby
parsed_underlying_data = JSON.parse(underlying_data.body)
```

Which returns . . .

```ruby
=> {"quotes"=>
  {"quote"=>
    {"symbol"=>"AAPL",
     "description"=>"Apple Inc",
     "exch"=>"Q",
     "type"=>"stock",
     "last"=>127.62,
     "change"=>2.36,
     "change_percentage"=>1.8900000000000001,
     "volume"=>55550382,
     "average_volume"=>52807718,
     "last_volume"=>0,
     "trade_date"=>1431116100000,
     "open"=>126.68,
     "high"=>127.62,
     "low"=>126.11,
     "close"=>127.62,
     "prevclose"=>125.26,
     "week_52_high"=>134.54,
     "week_52_low"=>82.904285,
     "bid"=>102.03,
     "bidsize"=>1,
     "bidexch"=>"Q",
     "bid_date"=>1431129600000,
     "ask"=>127.59,
     "asksize"=>0,
     "askexch"=>"Q",
     "ask_date"=>1431129600000,
     "root_symbols"=>"AAPL,AAPL7"}}}
```

Perfect! We have a good deal of quote related data in the response and now it's in a format we can do something with. We get quote data on multiple stocks by appending more symbols to the API endpoint, but I think the idea is fairly clear here. Feel free to try it out on your own.

Now that we know that our API calls are working, let's get what we need: historical data. If we go through the docs, we'll find the endpoint that we care about to be the following one if we wanted historical data on AAPL:

```
"https://sandbox.tradier.com/v1/markets/history?symbol=AAPL"
```

If we append that endpoint with `&start=2010-01-01` we will get the historical data from January 1st, 2010 through now:

```
"https://sandbox.tradier.com/v1/markets/history?symbol=AAPL&start=2010-01-01"
```

Let's reuse some of the Ruby code from before, except modify the endpoint:

```ruby
uri = URI.parse("https://sandbox.tradier.com/v1/markets/history?symbol=AAPL&start=2010-01-01")
http = Net::HTTP.new(uri.host, uri.port)
http.read_timeout = 30
http.use_ssl = true
http.verify_mode = OpenSSL::SSL::VERIFY_PEER
request = Net::HTTP::Get.new(uri.request_uri)
request["Accept"] = "application/json"
request["Authorization"] = "Bearer " + ENV["TOKEN"]
underlying_data = http.request(request)
parsed_underlying_data = JSON.parse(underlying_data.body)
```

What does our JSON-friendly parsed output look like?:

```ruby
parsed_underlying_data = JSON.parse(underlying_data.body)
=> {"history"=>
  {"day"=>
    [{"date"=>"2010-01-04", "open"=>30.49, "high"=>30.642857, "low"=>30.34, "close"=>30.572857, "volume"=>123432050},
     {"date"=>"2010-01-05", "open"=>30.657143, "high"=>30.798571, "low"=>30.464286, "close"=>30.625714, "volume"=>150476000},
     .
     .
     .
     {"date"=>"2015-05-07", "open"=>124.77, "high"=>126.08, "low"=>124.02, "close"=>125.26, "volume"=>43940895},
     {"date"=>"2015-05-08", "open"=>126.68, "high"=>127.62, "low"=>126.11, "close"=>127.62, "volume"=>55550382}]}}
```

Great! It looks like we have historical data from January 4, 2010 (the first trading day of that year) to the market close on Friday May 8, 2015. Keeping in mind that we're looking for the biggest positive and negative moves in a stock, we just need to parse that data to get the daily returns over the same time period and then filter those for the best and worst returns.

###Setting up a Sinatra server

Since we're going to have a Sinatra server acting as a workhorse for our API calls, we might as well set it up right. `touch Gemfile` in your root directory and populate it with the following code. We will need `sinatra`, `sinatra-contrib` and `pry`:

```ruby
source 'https://rubygems.org'

gem 'sinatra'
gem 'sinatra-contrib'
gem 'pry'
```

Run `bundle install` and `touch server.rb` in the root directory to create the server file we'll be working with. We'll also require a `views` folder for the front end, so let's create a directory called views and a file `views/show.erb` which will serve as the view for scatter plot. At this point, your directory structure should look like the following:

```
.
├── Gemfile
├── Gemfile.lock
├── server.rb
└── views
    └── show.erb
```

Let's get started on our `server.rb` file. We need to get from API call to the five best and worst performing days in a stock, so our logic will be something like the following:

1. Make API call to get historical data
2. Parse that historical data and create a temporary data structure to store daily returns
3. Filter the daily returns to get the five best and five worst dates and respective returns

Here's a skeleton of what our server file will look like:

```ruby
require 'sinatra'
require 'sinatra/json'
require 'uri'
require 'net/https'
require 'json'

## Get historical data from Tradier ##

def get_historicals(security)
  #return historical data
end

## Calculate price changes by day ##

def get_price_changes(security, historicals)
  # return data structure of price changes
end

## Get 5 best and 5 worst performing dates ##

def get_best_and_worst_five(security, price_changes)
  # return data structure of best five and worst five days and respective returns
end

## Sinatra app ##

## Route for AJAX request ##
get '/data/:security' do
  # return JSON of best and worst returns
end

## Route for view that has chart ##
get '/stocks/:security' do
  erb :show
end
```

Let's work through each of these parts step by step. First off, our code from before reflects what we ned for the `get_historicals(security)` method:

```ruby
def get_historicals(security)
  historicals = Hash.new

  uri = URI.parse("https://sandbox.tradier.com/v1/markets/history?symbol=#{security}&start=2010-01-01")
  http = Net::HTTP.new(uri.host, uri.port)
  http.read_timeout = 30
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_PEER
  request = Net::HTTP::Get.new(uri.request_uri)
  request["Accept"] = "application/json"
  request["Authorization"] = "Bearer " + ENV["TOKEN"]
  underlying_data = http.request(request)
  parsed_underlying_data = JSON.parse(underlying_data.body)

  historicals[security] = Hash.new

  data_by_date = parsed_underlying_data["history"]["day"]

  data_by_date.each do |data_on_date|
    date = data_on_date["date"]
    historicals[security][date] = Hash.new
    close = data_on_date["close"]
    historicals[security][date]["close"] = close
  end
  puts "#{security}. got tradier data."

  historicals
end
```

The second part of the method parses the returned underlying data and strips out the key things we care about: `date` and `close` (the stock's closing price). This returns a hash that looks like this:

```ruby
=> {"AAPL"=>
  {"2010-01-04"=>{"close"=>30.572857},
   "2010-01-05"=>{"close"=>30.625714},
   .
   .
   .
   "2015-05-07"=>{"close"=>125.26},
   "2015-05-08"=>{"close"=>127.62}}}
```

With that hash, we want to get the daily returns, so we need to calculate the percentage difference between day<sub>n</sub> and day<sub>n-1</sub>:

```ruby
def get_price_changes(security, historicals)

  price_changes = Hash.new

  historicals.each do |security, date_and_data|
    temp = nil
    price_changes[security] = Hash.new
    date_and_data.each do |date, data|
      last_price = historicals[security][date]["close"]
      prior_price = temp
      if temp
        price_changes[security][date] = last_price / prior_price - 1
      end
      temp = last_price
    end
  end

  price_changes
end
```

Instead of converting it into another data structure like an array, we can just do a bit of manipulation with a `temp` variable to generate another hash of all the price changes. Note that `temp` is initialized as `nil` so that we start these calculations on the *second* day. The output of `get_price_changes("AAPL", get_historicals("AAPL"))` would be the following:

```ruby
=> {"AAPL"=>
  {"2010-01-05"=>0.001728886508709282,
   "2010-01-06"=>-0.015906339359141097,
   .
   .
   .
   "2015-05-07"=>0.001999840012798959,
   "2015-05-08"=>0.01884081111288527}}
```

Note that I'm keeping the key of the security in this hash in case we want to expand on this later on and store multiple securities. Now we just need to filter the above hash for the five best and five worst performing dates and their respective returns:

```ruby
def get_best_and_worst_five(security, price_changes)
  best_and_worst_five = Hash.new

  price_changes.each do |security, date_and_return|
    best_and_worst_five[security] = Hash.new
    sorted_dates_and_returns = date_and_return.sort_by { |date, value| value }
    worst_dates_and_returns = sorted_dates_and_returns.first(5)
    best_dates_and_returns = sorted_dates_and_returns.last(5)
    worst_dates_and_returns.each do |date_and_return|
      best_and_worst_five[security][date_and_return.first] = date_and_return.last
    end
    best_dates_and_returns.each do |date_and_return|
      best_and_worst_five[security][date_and_return.first] = date_and_return.last
    end
  end

  best_and_worst_five
end
```

All that we're doing here is sorting the hash by the returns and then grabbing the first five and last five. This method returns the following:

```ruby
=> {"AAPL"=>
  {"2013-01-24"=>-0.12354938328012632,
   "2014-01-28"=>-0.07992733529505436,
   "2012-12-05"=>-0.06434556880538289,
   "2011-10-19"=>-0.05593975464190981,
   "2013-04-17"=>-0.05499250148982382,
   "2012-01-25"=>0.06243904804195233,
   "2012-11-19"=>0.072112159719254,
   "2010-05-10"=>0.07686763269000574,
   "2014-04-24"=>0.08198189201721995,
   "2012-04-25"=>0.08757666733553227}}
```

Great, so now we have the data that we need to eventually plot. What we're going to want to do now is think about the next steps. We'll have to issue an AJAX request to `/data/aapl` to get aapl's data (or `/data/:security` for any ticker). This is pretty straightforward. We grab the security from the params, `upcase` it so it's standardized and then run it through the methods we just devised above. Finally we return a json of the dates and returns of the best and worst five days:

```ruby
get '/data/:security' do
  security = params[:security].upcase

  historicals = get_historicals(security)
  price_changes = get_price_changes(security, historicals)
  best_and_worst_five = get_best_and_worst_five(security, price_changes)

  json best_and_worst_five[security]
end
```

Let's stop for a second and see what our entire `server.rb` file looks like up to this point:

```ruby
require 'sinatra'
require 'sinatra/json'
require 'uri'
require 'net/https'
require 'json'

## Get historical data from Tradier ##

def get_historicals(security)
  historicals = Hash.new

  uri = URI.parse("https://sandbox.tradier.com/v1/markets/history?symbol=#{security}&start=2010-01-01")
  http = Net::HTTP.new(uri.host, uri.port)
  http.read_timeout = 30
  http.use_ssl = true
  http.verify_mode = OpenSSL::SSL::VERIFY_PEER
  request = Net::HTTP::Get.new(uri.request_uri)
  request["Accept"] = "application/json"
  request["Authorization"] = "Bearer " + ENV["TOKEN"]
  underlying_data = http.request(request)
  parsed_underlying_data = JSON.parse(underlying_data.body)

  historicals[security] = Hash.new

  data_by_date = parsed_underlying_data["history"]["day"]

  data_by_date.each do |data_on_date|
    date = data_on_date["date"]
    historicals[security][date] = Hash.new
    close = data_on_date["close"]
    historicals[security][date]["close"] = close
  end
  puts "#{security}. got tradier data."

  historicals
end

## Calculate price changes by day ##

def get_price_changes(security, historicals)

  price_changes = Hash.new

  historicals.each do |security, date_and_data|
    temp = nil
    price_changes[security] = Hash.new
    date_and_data.each do |date, data|
      last_price = historicals[security][date]["close"]
      prior_price = temp
      if temp
        price_changes[security][date] = last_price / prior_price - 1
      end
      temp = last_price
    end
  end

  price_changes
end

## Get 5 best and 5 worst performing dates ##

def get_best_and_worst_five(security, price_changes)
  best_and_worst_five = Hash.new

  price_changes.each do |security, date_and_return|
    best_and_worst_five[security] = Hash.new
    sorted_dates_and_returns = date_and_return.sort_by { |date, value| value }
    worst_dates_and_returns = sorted_dates_and_returns.first(5)
    best_dates_and_returns = sorted_dates_and_returns.last(5)
    worst_dates_and_returns.each do |date_and_return|
      best_and_worst_five[security][date_and_return.first] = date_and_return.last
    end
    best_dates_and_returns.each do |date_and_return|
      best_and_worst_five[security][date_and_return.first] = date_and_return.last
    end
  end

  best_and_worst_five
end

## Sinatra app ##

## Route for AJAX request ##
get '/data/:security' do
  security = params[:security].upcase

  historicals = get_historicals(security)
  price_changes = get_price_changes(security, historicals)
  best_and_worst_five = get_best_and_worst_five(security, price_changes)

  json best_and_worst_five[security]
end

## Route for view that has chart ##
get '/stocks/:security' do
  erb :show
end
```

Let's check that this is working by hitting `http://localhost:4567/data/aapl`:

![alt](http://i.imgur.com/ijcVpvO.png)

Nice. What about `http://localhost:4567/data/twtr`?:

![alt](http://i.imgur.com/jwaZKoG.png)

Ok great, now that we know our data is what we expect, we can use it to make some nice looking charts!

##Plotting the data

Some familiarity with [Highcharts](https://www.highcharts.com) might be helpful for this last section. I covered Highcharts in two prior tutorials: [Enter Highcharts](http://vikramis.me/2015/05/01/enter-highcharts/) and [Wiring up Highcharts with a Rails API](http://vikramis.me/2015/05/01/highcharts-with-a-rails-api/). They might be good reference on the basics if you aren't familiar with it.

First run `mkdir public/javascripts` and `touch public/javascripts/chart.js` to generate that directory and respective file. Let's walk through the rest of the logic here:sl

```
1. Populate our show.erb file to have a container that will display the scatter plot
2. Write a public/javascript/chart.js file that will contain an AJAX GET request for the data at /data/:security and generates the scatter plot
```

First, let's add a container to our `show.erb` file for the chart. We're going to have to include jQuery, a couple highcharts libraries and the `chart.js` file as well:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Tradier App</title>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
    <script src="http://code.highcharts.com/highcharts.js"></script>
    <script src="http://code.highcharts.com/modules/exporting.js"></script>
    <script src="/javascripts/chart.js"></script>
  </head>

  <body>
    <div id="container" style="min-width: 310px; height: 400px; max-width: 800px; margin: 0 auto"></div>
  </body>
</html>
```

Great. This view will get rendered when we visit any security in the form of `http://localhost:4567/stocks/:security`. Right now it's empty which you can tell from your browser. If we visit `http://localhost:4567/stocks/twtr` we will see a white background. Let's update our `public/javascripts/chart.js` to change that. We'll put in a placeholder AJAX call to make sure it's working:

```javascript
$(document).ready(function() {
  $.ajax({
    cache: false,
    type: "GET",
    url: 'http://localhost:4567/data/twtr',
    dataType:'json',
    success: function(data) {
      alert("AJAX call worked!")
    },
    error: function() {
      alert("Sorry, something went wrong!")
    }
  });
});
```

Our AJAX `GET` request is hitting the `http://localhost:4567/data/twtr` route to and alerting us that it worked. When you visit `http://localhost:4567/stocks/twtr` now, you should see something like the following:

![alt](http://i.imgur.com/1JV6raH.png)

By the way, just to stop for a second and make sure we have all the files we need in the right place, your directory structure should look like this:

```
.
├── Gemfile
├── Gemfile.lock
├── public
│   └── javascripts
│       └── chart.js
├── server.rb
└── views
    └── show.erb
```

Now that we know our AJAX call working, we can update it step by step to get the data to display. The argument `data`, which is the JSON object getting sent from our `/data/twtr` path, can be manipulated to separate the gains from the losses in a format that's Highcharts friendly. You should confirm this by putting a debugger after `success` and see what `data` looks like.

We will want our series to look something like this:

`[[date1, return1], [date2, return2], [date3, return3], . . . ]`

To do that, we can do the following:

```javascript
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
}
```

Once we have `gains` and `losses`, we can write some Javascript code to calculate the average gain and average loss to refer to in the chart's legend:

```javascript
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
```

Now we just need to plug those variables into the right spots of the pre-built Highcharts [scatterplot](http://www.highcharts.com/demo/scatter). Note that I've renamed axes, title and subtitle among other chart attributes. Also, we need to change `url` based on the route we're on and the security we care about. We can do that by manipulating the url we've visited:

```
$(document).ready(function() {
  var thisUrlAsArray = window.location.href.split("/");
  var security = thisUrlAsArray[thisUrlAsArray.length - 1];
  var dynamicUrl = "http://localhost:4567/data/" + security;
  .
  .
  .
```

After all that, our `chart.js` file will look like this:

```javascript
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
```

After all that, visiting `http://localhost:4567/stocks/twtr` should look like this:

![alt](http://i.imgur.com/mX0xRwl.png)

Nice work! Producing some interesting visualizations wasn't too bad. We hit the Tradier API to get data we were intersted in. Following that, we parsed that data with Ruby in a format we cared about (JSON) based on some set of criteria (in our case, that criteria was to be able to see the best and worst five days and their respective returns). Finally, we did a bit of front-end work to grab that data with AJAX and display it.

There are some things we didn't really deal with here. For example, what if you tried navigating to a garbage security? Try it and see what happens. How would you protect against that?

Future tutorials will be how else we can play with the Tradier API to produce some valuable tools!
