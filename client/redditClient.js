const bent = require("bent");
const formurlencoded = require("form-urlencoded").default;

class RedditClient {
    #redditId = process.env.REDDIT_ID;
    #redditSecret = process.env.REDDIT_SECRET;
    #redditUsername = process.env.REDDIT_UNAME;
    #redditPassword = process.env.REDDIT_PWD;
    #auth_token = null;

    static timeRanges = Object.freeze(
        ["hour", "day", "week", "month", "year", "all"].reduce((obj, t) => {
            obj[t.toUpperCase] = Symbol(t);
            return obj;
        }, {})
    );
    constructor() {}

    async init() {
        await this.setupClient();
    }

    async setupClient() {
        const post = bent(
            200,
            "POST",
            "json",
            {
                Authorization: `Basic ${Buffer.from(
                    `${this.#redditId}:${this.#redditSecret}`
                ).toString("base64")}`,
                "User-Agent": "motivated:1.0 by miraclebob",
            },
            "https://www.reddit.com/api/v1/"
        );
        let params = formurlencoded({
            grant_type: "password",
            username: this.#redditUsername,
            password: this.#redditPassword,
        });

        this.#auth_token = (await post("access_token?" + params)).access_token;
    }

    async getHotPosts(subreddit, limit, timeRange, after) {
        const get = bent("https://oauth.reddit.com/", "GET", "json", 200, {
            Authorization: `Bearer ${this.#auth_token}`,
            "User-Agent": "motivated:1.0 by miraclebob",
        });

        let queryParams = formurlencoded({ limit, t: timeRange, after });
        const response = await get(`r/${subreddit}/hot?` + queryParams);
        let { children } = response.data;
        let lastRecordFromResponse = response.data.after;
        let validPostUrls = children
            .filter((o) => {
                return o.data.post_hint === "image" && o.data.is_self === false;
            })
            .map((o) => o.data.url);
        return { validPostUrls, lastRecordFromResponse };
    }
}

module.exports = {
    RedditClient,
};
