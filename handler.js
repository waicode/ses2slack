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
  console.log(sesData);
  const commonHeaders = sesData.mail.commonHeaders;

  const subject = commonHeaders.subject;

  // TODO: S3に保存してから本文を取得する
  const messageBody = "てすと。てすと。てすと。\nてすと。てすと。てすと。";

  let messageText =
    `<!channel>\n*${subject}*\n\n` + "```" + `${messageBody}` + "```\n";

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
