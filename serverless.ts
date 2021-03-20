import type { AWS } from "@serverless/typescript";

import hello from "@functions/hello";

const serverlessConfiguration: AWS = {
  service: "ses2slack",
  frameworkVersion: "2",
  custom: {
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    defaultStage: "local",
    localstack: {
      debug: true,
      stages: ["local", "dev"],
      autostart: true,
      lambda: { mountCode: true },
      docker: { sudo: false },
      endpointFile: "localstack_endpoints.json",
    },
  },
  plugins: ["serverless-webpack", "serverless-localstack"],
  provider: {
    name: "aws",
    runtime: "nodejs12.x",
    apiGateway: {
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
    },
    lambdaHashingVersion: "20201221",
  },
  // import the function via paths
  functions: { hello },
};

module.exports = serverlessConfiguration;
