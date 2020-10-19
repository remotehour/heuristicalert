# Heuristic Alert

Instant access to twitter mentions relevant to your interest/business

## Installation

```
$ git clone https://github.com/remotehour/heuristicalert.git
$ cd heuristicalert
$ yarn install
```

## Run

```
node index.js heuristicalert.yml
```

`heuristicalert.yml` looks like this:

```yaml
- query: Hello
  followers_count: 1000
  favorite_count: 10
  retweet_count: 10
```
