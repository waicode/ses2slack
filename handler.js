"use strict";

// const AWS = require("aws-sdk");
const request = require("request");

function generateJsonResponse(bodyJson, statusCode = 200) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(bodyJson, null, 2),
  };
}

module.exports.mailToSlack = (event, context, callback) => {
  console.info("event:");
  console.info(event);
  console.info("context:");
  console.info(context);
  console.info("callback:");
  console.info(callback);

  // const data = JSON.parse(event);

  // let messageText = `title: ${data.title} message: ${data.body}`;
  let messageText = `test!!!`;

  const options = {
    url: process.env.SLACK_WEB_HOOK_URL,
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
