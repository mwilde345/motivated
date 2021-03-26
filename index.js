"use strict";
const { TwilioClient } = require("./client/twilioClient");
const { RedditClient } = require("./client/redditClient");
const { DynamoClient } = require("./client/dynamoClient");
const { TWILIO_TO_NUMBERS } = require("./.config.js");

const twilio = new TwilioClient();
const reddit = new RedditClient();
const dynamo = new DynamoClient();

const REDDIT_POST_LIMIT = 10;
const SUBREDDIT = "GetMotivated";
const REDDIT_RETRY_COUNT = 3;

module.exports.handler = async (event) => {
    await reddit.init();

    let newPostUrls = [];
    let retries = REDDIT_RETRY_COUNT;
    let lastRecord = null;
    do {
        let {
            validPostUrls,
            lastRecordFromResponse,
        } = await reddit.getHotPosts(
            SUBREDDIT,
            REDDIT_POST_LIMIT,
            RedditClient.timeRanges.DAY,
            lastRecord
        );
        lastRecord = lastRecordFromResponse;

        let pastMessages = await dynamo.checkPastUrls(validPostUrls);

        newPostUrls = validPostUrls.filter((i) => {
            return !pastMessages.includes(i);
        });
        retries--;
    } while (!newPostUrls.length && retries >= 0);
    if (!newPostUrls.length) {
        console.log(`No new hot posts in r/${SUBREDDIT}`);
        await twilio.sendText(
            TWILIO_TO_NUMBERS[0],
            `No new hot posts in r/${SUBREDDIT}`,
            null
        );
        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    message: `No new posts for today in r/${SUBREDDIT}`,
                    input: event,
                },
                null,
                2
            ),
        };
    }
    const hottestNewPost = newPostUrls[0];

    for (let number of TWILIO_TO_NUMBERS) {
        await twilio.sendText(number, null, hottestNewPost);
    }
    await dynamo.persistNewUrl(hottestNewPost);

    // let buffer = await getBuffer("http://site.com/image.png");
    // let obj = await getJSON("http://site.com/json.api");

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: `Sent ${hottestNewPost} from r/${SUBREDDIT} to ${TWILIO_TO_NUMBERS}`,
                input: event,
            },
            null,
            2
        ),
    };

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
