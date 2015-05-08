require 'sinatra'
require 'sinatra/json'
require 'uri'
require 'net/https'
require 'json'
require 'pry'

INTERNET_STOCKS = %w[
  FB
  GOOGL
  YELP
  LNKD
  AMZN
  NFLX
  EBAY
  YHOO
  TWTR
  EXPE
  PCLN
]

## Get historical data from Tradier ##

def get_historicals(security)
  historicals = Hash.new

  count = 1

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
    volume = data_on_date["volume"]
    historicals[security][date]["close"] = close
    historicals[security][date]["volume"] = volume
  end
  puts "#{count}: #{security}. got tradier data."
  count += 1

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

get '/:security' do
  security = params[:security].upcase

  historicals = get_historicals(security)
  price_changes = get_price_changes(security, historicals)
  best_and_worst_five = get_best_and_worst_five(security, price_changes)

  erb :show, locals: { security: security, best_and_worst_five: best_and_worst_five }
end


