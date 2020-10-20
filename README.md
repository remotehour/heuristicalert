# Heuristic Alert

Instant access to twitter mentions relevant to your interest/business

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
- query: Hello
  followers_count: 1000
  favorite_count: 10
  retweet_count: 10
```
