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
* Explanation of how we'll get there.

<sup>1</sup> *Potential for meaningful volatility* here means stocks that have some likelihood of having a percentage move that would differ meaningfully from prior percentage moves around an earnings event. If, on average, stock XYZ had moved around 5% and I, based on whatever research I had put together, expected the stock to move 10%, I would consider that 10% to be *meaningfully volatile*.

##Introduction to Tradier
* What is Tradier, what does it accomplish?
* How to get setup on it.

##Using the Tradier API
* How you would grab some small piece of data with the Tradier API.
* How you would get historical data.
* Writing Ruby code to parse that data.
* How you would use Sinatra to make an API that returns that data.

##Plotting the data
* How you would use the API to plot the data?
* Link to other Highcharts tutorial.
* Show finished product.
