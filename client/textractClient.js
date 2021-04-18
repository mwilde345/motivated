const AWS = require("aws-sdk");

class TextractClient {
    constructor() {
        this.textractClient = new AWS.Textract();
    }
    async checkPicture() {
        return new Promise((res, rej) => {
            this.textractClient.getD(params, (err, data) => {
                if (err) {
                    console.log(err);
                    rej(err);
                } else res(data);
            });
        });
    }
}
