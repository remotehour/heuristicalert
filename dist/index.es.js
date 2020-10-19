import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import pino from 'pino';
import Bluebird from 'bluebird';
import Twitter from 'twitter';
import { IncomingWebhook } from '@slack/webhook';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

require('dotenv').config();
var logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
    prettyPrint: true,
    level: process.env.LOG_LEVEL || 'debug',
});
var twitter_url = 'https://twitter.com';
function createTwitterClient() {
    if (!process.env.TWITTER_CONSUMER_KEY ||
        !process.env.TWITTER_CONSUMER_SECRET ||
        !process.env.TWITTER_ACCESS_TOKEN_KEY ||
        !process.env.TWITTER_ACCESS_TOKEN_SECRET) {
        throw 'Please set environment variables.';
    }
    return new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });
}
function createSlackWebhook() {
    if (!process.env.SLACK_WEBHOOK_URL) {
        throw 'Please set environment variables.';
    }
    var url = process.env.SLACK_WEBHOOK_URL;
    return new IncomingWebhook(url);
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var current_time, configPath, configYaml, keywords, client;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    current_time = new Date().getTime();
                    configPath = path.resolve(process.argv[2]);
                    logger.info('using config file: %s', configPath);
                    configYaml = fs.readFileSync(configPath, 'utf8');
                    keywords = yaml.safeLoad(configYaml);
                    logger.info('configuration: \n%s', configYaml);
                    if (!Array.isArray(keywords)) {
                        throw 'Wrong configuration.';
                    }
                    client = createTwitterClient();
                    return [4 /*yield*/, Bluebird.map(keywords, function (keyword) { return __awaiter(_this, void 0, void 0, function () {
                            var tweets;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, client.get('search/tweets', {
                                            q: keyword.query,
                                            count: 100000,
                                            result_type: 'recent',
                                            exclude: 'retweets',
                                        })];
                                    case 1:
                                        tweets = _a.sent();
                                        return [4 /*yield*/, Bluebird.map(tweets.statuses, function (tweet) { return __awaiter(_this, void 0, void 0, function () {
                                                var created_at, id_str, text, user, link, tweet_time, time_diff;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            created_at = tweet.created_at, id_str = tweet.id_str, text = tweet.text, user = tweet.user;
                                                            link = twitter_url + "/" + user.screen_name + "/status/" + id_str;
                                                            // NOTE: configure tweets on your customized settings
                                                            if (user.followers_count < keyword.followers_count ||
                                                                user.favorite_count < keyword.favorite_count ||
                                                                user.retweet_count < keyword.retweet_count) {
                                                                logger.info('Tweet does not meet conditions. skip', link);
                                                                return [2 /*return*/];
                                                            }
                                                            tweet_time = new Date(created_at).getTime();
                                                            time_diff = (current_time - tweet_time) / 3600000;
                                                            if (time_diff > 1) {
                                                                logger.info('The tweet is not tweeted within one hour. skip', link);
                                                                return [2 /*return*/];
                                                            }
                                                            logger.info('posting slack: %s', link);
                                                            return [4 /*yield*/, createSlackWebhook().send({
                                                                    channel: 'notifications-test',
                                                                    attachments: [
                                                                        {
                                                                            author_name: user.name,
                                                                            author_link: twitter_url + "/" + user.slug,
                                                                            text: name + " tweeted a tweet about 'hello'\n" + text + "\nURL: " + link,
                                                                            color: '#00acee',
                                                                        },
                                                                    ],
                                                                })];
                                                        case 1:
                                                            _a.sent();
                                                            logger.info('successfully sent to slack: %s', link);
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    cron.schedule('0 * * * *', main);
    logger.info('Successfully scheduled Heuristic Alert for every one hour');
    logger.info('Now running initial crawling');
    main();
}

export { run };
//# sourceMappingURL=index.es.js.map
