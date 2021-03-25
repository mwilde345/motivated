"use strict";
const bent = require("bent");
const formurlencoded = require("form-urlencoded").default;
const twilio = require("twilio");
const AWS = require("aws-sdk");

var accountSid = process.env.TWILIO_ACC_ID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIO_AUTH; // Your Auth Token from www.twilio.com/console
const twilioClient = new twilio(accountSid, authToken);
const dynamo = new AWS.DynamoDB();

module.exports.handler = async (event) => {
  const getJSON = bent("json");
  const getBuffer = bent("buffer");

  const post = bent(
    200,
    "POST",
    "json",
    {
      Authorization: `Basic ${Buffer.from(
        `${process.env.REDDIT_ID}:${process.env.REDDIT_SECRET}`
      ).toString("base64")}`,
      "User-Agent": "motivated:1.0 by miraclebob",
    },
    "https://www.reddit.com/api/v1/"
  );
  let params = formurlencoded({
    grant_type: "password",
    username: process.env.REDDIT_UNAME,
    password: process.env.REDDIT_PWD,
  });
  const auth_token = (await post("access_token?" + params)).access_token;
  console.log(auth_token);

  const get = bent("https://oauth.reddit.com/", "GET", "json", 200, {
    Authorization: `Bearer ${auth_token}`,
    "User-Agent": "motivated:1.0 by miraclebob",
  });
  let subParams = formurlencoded({ limit: 2, t: "day" });
  const response = await get("r/GetMotivated/hot?" + subParams);
  let { after, children } = response.data;
  console.log(children.length);
  let validPosts = children.filter((o) => {
    return o.data.post_hint === "image" && o.data.is_self === false;
  });

  let params = {
    ExpressionAttributeNames: {
      "#AT": "AlbumTitle",
      "#ST": "SongTitle",
    },
    ExpressionAttributeValues: {
      ":a": {
        S: "No One You Know",
      },
    },
    FilterExpression: "Artist = :a",
    ProjectionExpression: "#ST, #AT",
    TableName: "Music",
  };

  let alreadySentFiles = dynamo.scan({});

  for (const post of validPosts) {
    console.log(post.data.url);
    console.log(await getBuffer(post.data.url));

    await twilioClient.messages
      .create({
        to: "+14355925998", // Text this number
        from: "+12067370668", // From a valid Twilio number
        mediaUrl: post.data.url,
      })
      .then((message) => console.log(message.sid));
  }

  // let buffer = await getBuffer("http://site.com/image.png");
  // let obj = await getJSON("http://site.com/json.api");

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "Go Serverless v1.0! Your function executed successfully!",
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
