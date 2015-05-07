require 'uri'
require 'net/https'
require 'json'
require 'pry'

securities = %w[
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

historicals = Hash.new

count = 1
securities.each do |security|
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
end

binding.pry
