require('dotenv').config();
var Twitter = require('twitter')

var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

client.get('search/tweets', {q: 'hello', count: 100000, result_type: "recent", exclude: "retweets"}, function(error, tweets) {
  if(!error) {
    var { statuses } = tweets
    statuses.forEach(tweet => {
      console.log(tweet)
    })
  }
});