# Heuristicalert

Instant access to twitter mentions relevant to your interest/business.

It crawls Twitter every one hour and notify to Slack.

## Installation

```
npm -g install heuristicalert
```

## Run

```
env TWITTER_CONSUMER_KEY=xxx \
    TWITTER_CONSUMER_SECRET=xxx \
    TWITTER_ACCESS_TOKEN_KEY=xxx \
    TWITTER_ACCESS_TOKEN_SECRET=xxx \
    SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx \
    heuristicalert heuristicalert.yml
```

`heuristicalert.yml` looks like this:

```yaml
# Tweet including "Hello" and author's followers > 1000, favorite > 10, retweet > 10
- query: Hello
  followers_count: 1000
  favorite_count: 10
  retweet_count: 10
  
# Every tweet including "Remotehour"
- query: Remotehour
  followers_count: 0
  favorite_count: 0
  retweet_count: 0
```

# TODO

- [ ] Add "oneshot" run 
- [ ] Customize cron scheduling
- [ ] Docker integration
