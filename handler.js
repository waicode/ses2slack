"use strict";

// aws
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_REGION_NAME });

// mailparser
const simpleParser = require("mailparser").simpleParser;

// request
const request = require("request");

function generateJsonResponse(bodyJson, statusCode = 200) {
  return {
    statusCode: statusCode,
    body: JSON.stringify(bodyJson, null, 2),
  };
}

async function getMailObject(messageId, s3bucketName) {
  const s3 = new AWS.S3();
  console.info("S3_MAIL_BUCKET_NAME: ");
  console.info(s3bucketName);
  try {
    const mailObject = await s3
      .getObject({ Bucket: s3bucketName, Key: messageId })
      .promise();
    console.info("mailObject: ");
    console.info(JSON.stringify(mailObject));
    return mailObject;
  } catch (err) {
    console.error("Failed to get S3 object.");
    console.error(err);
  }
}

async function getHookSecretValue(regionName, secretName) {
  const client = new AWS.SecretsManager({
    region: regionName,
  });

  try {
    const hookSecretValue = await client
      .getSecretValue({ SecretId: secretName })
      .promise();
    console.info("hookSecretValue: ");
    console.info(JSON.stringify(hookSecretValue));
    return hookSecretValue;
  } catch (err) {
    console.error("Failed to get SecretsManager Value.");
    console.error(err);
  }
}

async function getAWSResources(
  regionName,
  s3bucketName,
  messageId,
  secretName
) {
  const [mailObject, hookSecretValue] = await Promise.all([
    getMailObject(messageId, s3bucketName),
    getHookSecretValue(regionName, secretName),
  ]);
  return [mailObject, hookSecretValue];
}

module.exports.mailToSlack = (event, context, callback) => {
  const sesData = event.Records[0].ses;
  const commonHeaders = sesData.mail.commonHeaders;
  const messageId = sesData.mail.messageId;
  const subject = commonHeaders.subject;

  getAWSResources(
    process.env.AWS_REGION_NAME,
    process.env.S3_MAIL_BUCKET_NAME,
    messageId,
    process.env.SLACK_WEB_HOOK_SECRET
  )
    .then(([mailObject, hookSecretValue]) => {
      const hookUrl = JSON.parse(hookSecretValue["SecretString"]).slackHookUrl;
      const mailBinaryData = mailObject["Body"];
      const mailTextData = mailBinaryData.toString();

      // Parse mail object
      simpleParser(mailTextData).then((parsed) => {
        const messageBody = parsed.text;

        console.info(`subject: ${subject} messageBody: ${messageBody}`);

        const messageText =
          `<!channel>\n\n*${subject}*\n\n` + "```" + `${messageBody}` + "```\n";

        const requestOptions = {
          url: hookUrl,
          headers: {
            "Content-type": "application/json",
          },
          body: {
            text: messageText,
          },
          json: true,
        };

        // Send message
        request.post(requestOptions, (error, response, body) => {
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
      });
    })
    .catch((err) => {
      console.error("Failed to parse mail object.");
      console.error(err);
    });
};
