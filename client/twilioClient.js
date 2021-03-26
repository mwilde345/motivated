const twilio = require("twilio");

class TwilioClient {
    #accountSid = process.env.TWILIO_ACC_ID; // Your Account SID from www.twilio.com/console
    #authToken = process.env.TWILIO_AUTH; // Your Auth Token from www.twilio.com/console
    #twilioNumber = process.env.TWILIO_NUMBER; // Your twilio number (from address)
    constructor() {
        this.twilioClient = new twilio(this.#accountSid, this.#authToken);
    }
    sendText(toNumber, body, mediaUrl) {
        let params = mediaUrl
            ? {
                  to: toNumber, // Text this number
                  from: this.#twilioNumber, // From a valid Twilio number
                  mediaUrl,
              }
            : {
                  to: toNumber, // Text this number
                  from: this.#twilioNumber, // From a valid Twilio number
                  body,
              };
        return this.twilioClient.messages
            .create(params)
            .then((message) => console.log("Twilio message id: ", message.sid))
            .catch((err) => console.log(err));
    }
}

module.exports = {
    TwilioClient,
};
