"use strict";
const bent = require("bent");
const formurlencoded = require("form-urlencoded").default;

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
  let subParams = formurlencoded({ limit: 10, t: "day" });
  const response = await get("r/GetMotivated/hot?" + subParams);
  let { after, children } = response.data;
  console.log(children.length);
  let validPosts = children.filter((o) => {
    return o.data.post_hint === "image" && o.data.is_self === false;
  });
  await validPosts.forEach(async (o) => {
    console.log(o.data.url)
    console.log((await getBuffer(o.data.url)));
  });

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
