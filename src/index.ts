require('dotenv').config()
import got from 'got'

import yaml from 'js-yaml'
import fs from 'fs'
import path from 'path'
import cron from 'node-cron'
import pino from 'pino'
import Bluebird from 'bluebird'
import Twitter from 'twitter'
import { IncomingWebhook } from '@slack/webhook'

interface Config {
  lang: string
  query: string
  followers_count: number
  favorite_count: number
  retweet_count: number
}

// @ts-ignore
const logger = pino({
  timestamp: pino.stdTimeFunctions.isoTime,
  prettyPrint: true,
  level: process.env.LOG_LEVEL || 'debug',
})

const twitter_url = 'https://twitter.com'

function createTwitterClient() {
  if (
    !process.env.TWITTER_CONSUMER_KEY ||
    !process.env.TWITTER_CONSUMER_SECRET ||
    !process.env.TWITTER_ACCESS_TOKEN_KEY ||
    !process.env.TWITTER_ACCESS_TOKEN_SECRET
  ) {
    throw 'Please set environment variables.'
  }
  return new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  })
}

function createSlackWebhook() {
  if (!process.env.SLACK_WEBHOOK_URL) {
    throw 'Please set environment variables.'
  }

  const url = process.env.SLACK_WEBHOOK_URL
  return new IncomingWebhook(url)
}

async function getConfig() {
  const maybeConfigPath = process.argv[2]

  if (maybeConfigPath) {
    logger.info('Using config file: %s', maybeConfigPath)
    if (maybeConfigPath.startsWith('http')) {
      const res = await got(maybeConfigPath)
      return res.body
    }
    if (maybeConfigPath.startsWith('/')) {
      return fs.readFileSync(maybeConfigPath, 'utf8')
    }
    return fs.readFileSync(path.resolve(maybeConfigPath), 'utf8')
  }
  const assumingFilePath = path.resolve(process.cwd(), 'heuristicalert.yml')
  logger.info('Using config file: %s', assumingFilePath)
  return fs.readFileSync(assumingFilePath, 'utf8')
}

async function main() {
  const current_time = new Date().getTime()

  const keywords = yaml.safeLoad(await getConfig())
  logger.info('Configuration: \n%j', keywords)

  if (!Array.isArray(keywords)) {
    throw 'Wrong configuration.'
  }

  const client = createTwitterClient()
  await Bluebird.each(keywords as Config[], async (keyword) => {
    const tweets = await client.get('search/tweets', {
      q: keyword.query,
      lang: keyword.lang,
      count: 100000,
      result_type: 'recent',
      exclude: 'retweets',
    })
    await Bluebird.each(tweets.statuses, async (tweet: any) => {
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

      logger.info('Posting to slack: %s', link)

      await createSlackWebhook().send({
        channel: process.env.SLACK_CHANNEL,
        attachments: [
          {
            author_name: user.name,
            author_link: `${twitter_url}/${user.screen_name}`,
            text: `${user.name} tweeted a tweet about "${keyword.query}"\n${text}\nURL: ${link}`,
            color: '#00acee',
          },
        ],
      })

      logger.info('Successfully sent to slack: %s', link)
    })
  })

  logger.info('Done main cralwling. Waiting for the next run.')
}

export function run() {
  cron.schedule('0 * * * *', main)

  logger.info('Successfully scheduled Heuristic Alert for every one hour')
  logger.info('Now running initial crawling')

  main()

  process.on('SIGTERM', () => {
    logger.info('Terminating Heuristic Alert')
    process.exit(0)
  })
}
