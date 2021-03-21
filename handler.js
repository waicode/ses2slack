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
  const sesData = event.Records[0].ses;
  const commonHeaders = sesData.commonHeaders;
  const messageId = commonHeaders.messageId;
  const subject = commonHeaders.subject;
  const fromList = commonHeaders.from;
  const toList = commonHeaders.to;

  // TODO: S3に保存してから本文を取得する
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
