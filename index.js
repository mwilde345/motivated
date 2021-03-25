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
    let subParams = formurlencoded({ limit: 3, t: "day" });
    const response = await get("r/GetMotivated/hot?" + subParams);
    let { after, children } = response.data;
    console.log(children.length);
    let validPostUrls = children
        .filter((o) => {
            return o.data.post_hint === "image" && o.data.is_self === false;
        })
        .map((o) => o.data.url);
    console.log(validPostUrls);
	console.log(validPostUrls.map((url) => ({
		'file_url': { S: url },
	})))
    let getItemsParams = {
        RequestItems: {
            'MotivationDDBTable': {
                ExpressionAttributeNames: {
                    "#F": "file_url",
                    "#T": "time_sent",
                },
                Keys: validPostUrls.map((url) => ({
                    'file_url': { 'S': url },
                })),
                ProjectionExpression: "#F, #T",
            },
        },
    };

	// var params = {
	// 	RequestItems: {
	// 	  'TABLE_NAME': {
	// 		Keys: [
	// 		  {'KEY_NAME': {N: 'KEY_VALUE_1'}},
	// 		  {'KEY_NAME': {N: 'KEY_VALUE_2'}},
	// 		  {'KEY_NAME': {N: 'KEY_VALUE_3'}}
	// 		],
	// 		ProjectionExpression: 'KEY_NAME, ATTRIBUTE'
	// 	  }
	// 	}
	//   };

    let alreadySentFiles = await new Promise((res, rej) => {
        dynamo.batchGetItem(getItemsParams, (err, data) => {
            if (err) {
                console.log(err);
                rej(err);
            } else {
				res(data.Responses.MotivationDDBTable);
			}
        });
    });
    console.log('sent already: ', alreadySentFiles);
	const leftover = validPostUrls.filter(i => {
		return !(alreadySentFiles.map(o => o.file_url.S).includes(i))
	});
	console.log('leftover', leftover);
    for (const url of leftover) {
        await twilioClient.messages
            .create({
                to: "+14355925998", // Text this number
                from: "+12067370668", // From a valid Twilio number
                mediaUrl: url,
            })
            .then((message) => console.log(message.sid));
        await new Promise((res, rej) => {
            dynamo.putItem(
                {
                    Item: {
                        file_url: {
                            S: url,
                        },
                        time_sent: {
                            S: new Date().toString(),
                        },
                    },
                    TableName: "MotivationDDBTable",
                },
                (err, data) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    } else {
						console.log(`saved ${url} to db`);
						res(data);
					}
                }
            );
        });
    }

    // let buffer = await getBuffer("http://site.com/image.png");
    // let obj = await getJSON("http://site.com/json.api");

    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message:
                    "Go Serverless v1.0! Your function executed successfully!",
                input: event,
            },
            null,
            2
        ),
    };

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
