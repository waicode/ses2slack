![ses2slack](https://i.gyazo.com/27885f31d143fce88ff1c20b2d880a28.png "ses2slack")

Amazon Simple Email Service ([Amazon SES](https://aws.amazon.com/jp/ses/)) で受信したメールを Slack へ通知する AWS Lambda アプリケーションです。AWS リソースの構成管理及びモジュールのデプロイには[Serverless Framework](https://www.serverless.com/)を使っています。

# 📮 アーキテクチャ

以下の AWS リソースは Serverless Framework で作成されます。

- メール受信時に起動される Lambda
- 受信メールが保存される S3
- Slack 通知先を格納する Secret Manager

Amazon SES は手動で AWS コンソール画面から設定します。
メール受信のためにドメイン登録及び Route53 への DNS レコード設定が必要です。

Slack のチャンネル通知先 URL（Incoming Webhook）は Slack アプリ設定画面から取得してください。

# 📥 事前準備

## Amazon SES の設定

TODO: 要記載

## Slack の設定

TODO: 要記載

## Node.js/npm の preinstall

[Serverless Framework](https://www.serverless.com/) を動かすための Node.js は 12.x 系（lts/erbium）を使っています。
開発環境における Node.js 自体バージョンは [nvm](https://github.com/nvm-sh/nvm) で管理しています。
12.x 系のバージョンを使うために nvm の設定ファイル`.nvmrc`でバージョンを指定しています。
プロジェクトフォルダ移動時に`.nvmrc`の設定を自動適用させるために`.envrc`（[direnv](https://github.com/direnv/direnv)）を使って`nvm use`（`.nvmrc`の読込み）を行います。

以下を事前に完了させる必要があります。

- nvm をインストール
- nvm を使って`lts/erbium`の Node.js をインストール
- direnv をインストール
- プロジェクトルート直下で`direnv allow .`を実行して`.envrc`を自動読込

## Serverless Framework の preinstall (npm i -g ...)

Serverless Framework 関連のパッケージは事前にグローバルモードでインストールしておきます。

```
npm i -g serverless serverless-localstack serverless-dotenv-plugin serverless-cloudformation-changesets
```

- serverless
- serverless-localstack
- serverless-dotenv-plugin
- serverless-cloudformation-changesets

Serverless Framework はグローバル環境で動かすことを前提としています。グローバル環境でないと正常に動作しないことがあるので注意してください。

グローバルモードでは`root`が所有する`{prefix}/lib/node_modules/`にパッケージがインストールされます。

`{prefix}`は通常は`/usr`または`/usr/local`または`/opt/homebrew`です。

# 🏷 環境変数について

開発用の環境変数は`.env`（dotenv）で指定します。Slack の URL や AWS アカウント ID はダミー値を入れているので、書き換えてください。ステージング及び本番環境への環境変数適用は deploy 時にオプション引数で設定できます。

```
sls deploy --stage st --awsAccountId 000000000000 --slackHookUrl https://hooks.slack.com/services/.../.../...
```
