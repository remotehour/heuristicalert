require('dotenv').config()

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const pino = require('pino')
const Bluebird = require('bluebird')

const logger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
})

const Twitter = require('twitter')
const { IncomingWebhook } = require('@slack/webhook')

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
})
const twitter_url = 'https://twitter.com'

const url = process.env.SLACK_WEBHOOK_URL
const webhook = new IncomingWebhook(url)

const current_time = new Date().getTime()

const configPath = path.resolve(process.argv[2])
logger.info('using config file: %s', configPath)

const configYaml = fs.readFileSync(configPath, 'utf8')
const keywords = yaml.safeLoad(configYaml)
logger.info('configuration: \n%s', configYaml)

async function main() {
  await Bluebird.map(keywords, async (keyword) => {
    const tweets = await client.get('search/tweets', {
      q: keyword.query,
      count: 100000,
      result_type: 'recent',
      exclude: 'retweets',
    })
    await Bluebird.map(tweets.statuses, async (tweet) => {
      const { created_at, id_str, text, user } = tweet

      const link = `${twitter_url}/${user.screen_name}/status/${id_str}`

      // NOTE: configure tweets on your customized settings
      if (
        user.followers_count < keyword.followers_count ||
        user.favorite_count < keyword.favorite_count ||
        user.retweet_count < keyword.retweet_count
      ) {
        logger.info('Tweet does not meet conditions. skip', link)
        return
      }

      // NOTE: created_at should be within 1 hour
      const tweet_time = new Date(created_at).getTime()
      const time_diff = (current_time - tweet_time) / 3600000
      if (time_diff > 1) {
        logger.info('The tweet is not tweeted within one hour. skip', link)
        return
      }

      logger.info('posting slack: %s', link)

      // await webhook.send({
      //   channel: 'notifications-test',
      //   attachments: [
      //     {
      //       author_name: user.name,
      //       author_link: `${twitter_url}/${user.slug}`,
      //       text: `${name} tweeted a tweet about 'hello'\n${text}\nURL: ${link}`,
      //       color: '#00acee',
      //     },
      //   ],
      // })

      logger.info('successfully sent to slack: %s', link)
    })
  })
}

cron.schedule('0 * * * *', main)

main()

logger.info('Successfully scheduled Heuristic Alert for every one hour')
