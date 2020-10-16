require('dotenv').config();

const Twitter = require('twitter')
const { IncomingWebhook } = require('@slack/webhook');
const yaml = require('js-yaml')
const fs   = require('fs');

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
const twitter_url = "https://twitter.com"

const url = process.env.SLACK_WEBHOOK_URL;
const webhook = new IncomingWebhook(url);

const current_time = new Date().getTime()

const keywords = yaml.safeLoad(fs.readFileSync('./config/keywords.yml', 'utf8'));

keywords.forEach(keyword => {
  client.get('search/tweets', {q: keyword.name, count: 100000, result_type: "recent", exclude: "retweets"}, function(error, tweets) {
    if(!error) {
      const { statuses } = tweets
      statuses.forEach(tweet => {
        const { created_at, id, user, text } = tweet
        const { followers_count, favorite_count, name, retweet_count, screen_name } = user
  
        // NOTE: created_at should be within 1 hour
        const tweet_time = new Date(created_at).getTime()
        const time_diff = (current_time - tweet_time) / 3600000
        if(time_diff > 1) return
  
        // NOTE: configure tweets on your customized settings
        if(
          followers_count < keyword.followers_count ||
          favorite_count < keyword.favorite_count ||
          retweet_count < keyword.retweet_count
        ) return
  
        const attachments = {
          attachments: [
            {
              author_name: user.name,
              author_link: `${twitter_url}/${user.slug}`,
              text: `${name} tweeted a tweet about 'hello'\n${text}\nURL: ${twitter_url}/${screen_name}/status/${id}`,
              color: '#00acee',
            },
          ],
        }
        webhook.send(attachments);
      })
    }
  });
})
