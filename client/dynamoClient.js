const AWS = require("aws-sdk");

class DynamoClient {
    #dynamoTableName = "MotivationDDBTable";

    constructor() {
        this.dynamoClient = new AWS.DynamoDB();
    }

    async checkPastUrls(imageUrls) {
        let getItemsParams = {
            RequestItems: {
                MotivationDDBTable: {
                    ExpressionAttributeNames: {
                        "#F": "file_url",
                        "#T": "time_sent",
                    },
                    Keys: imageUrls.map((url) => ({
                        file_url: { S: url },
                    })),
                    ProjectionExpression: "#F, #T",
                },
            },
        };
        return new Promise((res, rej) => {
            this.dynamoClient.batchGetItem(getItemsParams, (err, data) => {
                if (err) {
                    console.log(err);
                    rej(err);
                } else {
                    res(
                        data.Responses.MotivationDDBTable.map(
                            (item) => item.file_url.S
                        )
                    );
                }
            });
        });
    }

    async persistNewUrl(newUrl) {
        return new Promise((res, rej) => {
            this.dynamoClient.putItem(
                {
                    Item: {
                        file_url: {
                            S: newUrl,
                        },
                        time_sent: {
                            S: new Date().toString(),
                        },
                    },
                    TableName: this.#dynamoTableName,
                },
                (err, data) => {
                    if (err) {
                        console.log(err);
                        rej(err);
                    } else {
                        console.log(`saved ${newUrl} to db`);
                        res(data);
                    }
                }
            );
        });
    }
}

module.exports = {
    DynamoClient,
};
