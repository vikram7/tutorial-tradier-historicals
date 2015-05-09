##Introduction

When I actively traded options in stocks around earnings events, stocks that had the *potential for meaningful volatility*<sup>1</sup> in an upcoming earnings event were the most interesting. I tended to play [straddles](http://www.investopedia.com/terms/s/straddle.asp) and [strangles](http://www.investopedia.com/terms/s/strangle.asp) around stocks that I expected to this kind of meaningful volatility. If they had the potential to be up or down significantly, I found them interesting. Some worked and many didn't, but the plays that worked meaningfully overwrote the costs of the ones that didn't, resulting in a profitable strategy.

I'd often look at Bloomberg's `EE` function to determine whether or not a trade would be worth putting on:

![alt](http://i.imgur.com/b4Cc5rL.png)

In addition to the above data, `EE` would provide past percentage moves following an earnings event for a company. If AAPL had a fantastic earnings event in the past it might move +8% afterwards. If TWTR had a horrendous earnings event (like recently), it might be move -27%. Conversely, some stocks like GE or F might not move a lot around earningss. Understanding how much a stock had moved in the past is an essential part of determining whether or not a future options trade is worth putting on.

Now that I don't have Bloomberg anymore, I wanted to see if there was an easy way to get similar data. While not exactly the same, I was able to get historical stock data to determine the largest positive and negative returns of a stock over the last five years using the [Tradier API](https://developer.tradier.com/). Finding out those returns would serve as a reasonable proxy for determining a stock's ability to move around earnings.

After hooking up to the Tradier API in Ruby with a [Sinatra](www.sinatrarb.com) server and getting the data visualized with [Highcharts](https://www.highcharts.com) using a bit of Javascript and Ajax, I found that I could have a feature similar to what I had been using before as a professional trader:

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

Great! It looks like we have historical data from January 4, 2010 (the first trading day of that year) to the market close on Friday May 8, 2015. Keeping in mind that we're looking for the biggest positive and negative moves in a stock, we just need to parse that data to get the daily returns over the same time period.

* Writing Ruby code to parse that data.
* How you would use Sinatra to make an API that returns that data.

##Plotting the data
* How you would use the API to plot the data?
* Link to other Highcharts tutorial.
* Show finished product.
