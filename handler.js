"use strict";

const AWS = require("aws-sdk");
const request = require("request");

function generateJsonResponse(bodyJson, statusCode = 200) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(bodyJson, null, 2),
  };
}

async function getMailObject(messageId) {
  try {
    return await s3
      .getObject({ Bucket: process.env.S3_MAIL_BUCKET_NAME, Key: messageId })
      .promise();
  } catch (err) {
    console.error("Failed to get S3 object.");
  }
}

function getHookUrl() {
  secret_name = process.env.SLACK_WEB_HOOK_SECRET;
  secretsmanager_client = AWS.client(
    "secretsmanager",
    (region_name = process.env.AWS_REGION_NAME)
  );
  let resp = secretsmanager_client.get_secret_value((SecretId = secret_name));
  let secret = json.loads(resp["SecretString"]);
  return secret["SLACK_WEBHOOK_URL"];
}

module.exports.mailToSlack = (event, context, callback) => {
  const sesData = event.Records[0].ses;
  console.log(sesData);
  const commonHeaders = sesData.mail.commonHeaders;
  const messageId = sesData.mail.messageId;

  const subject = commonHeaders.subject;
  const response = getMailObject(messageId);
  const messageBody = response.Body;

  let messageText =
    `<!channel>\n*${subject}*\n\n` + "```" + `${messageBody}` + "```\n";

  const options = {
    url: getHookUrl(),
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
