"use strict";
const AWS = require("aws-sdk");
const request = require("request");

function generateJsonResponse(bodyJson, statusCode = 200) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(bodyJson, null, 2),
  };
}

module.exports.mailToSlack = (event, context, callback) => {
  // const ses = new AWS.SES({ region: env.AWS_REGION });
  const data = JSON.parse(event.body);
  let messageText = `title: ${data.title} message: ${data.body}`;
  const options = {
    url: env.SLACK_WEB_HOOK_URL,
    headers: {
      "Content-type": "application/json",
    },
    body: {
      text: messageText,
    },
    json: true,
  };

  //メッセージ送信
  request.post(options, (error, response, body) => {
    if (error) {
      return generateJsonResponse(500, {
        message: "mailToSlack function were failed.",
        error: error,
      });
    } else {
      return generateJsonResponse(200, {
        message: "mailToSlack function executed successfully.",
        response: response,
        body: body,
      });
    }
  });
};

module.exports.hello = async (event) => {
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
};
