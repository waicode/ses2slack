![ses2slack](https://i.gyazo.com/27885f31d143fce88ff1c20b2d880a28.png "ses2slack")

Amazon Simple Email Service ([Amazon SES](https://aws.amazon.com/jp/ses/)) で受信したメールを Slack へ通知する AWS Lambda アプリケーションです。AWS リソースの構成管理及びモジュールのデプロイには[Serverless Framework](https://www.serverless.com/)を使っています。

<br />

# 💌 見逃せないメールをSlackへ

たとえば、古いシステムの障害通知をメールへ送っているけど、本当はSlackにも送りたい（でも、古いので直すのも大変…）といったことがあるかもしれません。メールよりもSlackをはじめとするチャットサービスの方が、普段意識を向けているので異常が起きた事にすぐに気付けます。

ses2slackを使えば、**Amazon SESで受信したメールをそのままslackへ通知**できます。通知先のメールアドレスを１つ追加するだけで、Slackへ通知可能です。受信したメール情報はAWS Lambdaを介してSlackへ通知されます。メールの送信元や件名、本文を解析して、特定のメールだけSlackへ通知させることもできます。

<br />
<br />

# 📮 アーキテクチャはサーバレス

以下のAWSリソースはServerless Frameworkで作成されます。

- メール受信時に起動されるLambda
- 受信メールが保存されるS3
- Slack通知先を格納するSecret Manager

Amazon SESはメール受信のためにドメイン登録及びRoute53へDNSレコード設定が必要です。そのため、SESは手動でAWSコンソールから設定します。

Slackのチャンネル通知先URL（Incoming Webhook）はSlackアプリ設定画面から取得して、アプリケーションのデプロイ時に設定します。

<br />
<br />

# 📥 開発環境の事前準備

## Node.js/npm の preinstall

[Serverless Framework](https://www.serverless.com/) を動かすためのNode.jsは12.x系（lts/erbium）を使っています。
開発環境におけるNode.js自体バージョンは [nvm](https://github.com/nvm-sh/nvm) で管理しています。
12.x系のバージョンを使うためにnvmの設定ファイル`.nvmrc`でバージョンを指定しています。
プロジェクトフォルダ移動時に`.nvmrc`の設定を自動適用させるために[direnv](https://github.com/direnv/direnv)の`.envrc`を使って`nvm use`（`.nvmrc`の読込み）を行います。

以下を事前に完了させる必要があります。

- nvmをインストール
- nvmを使って`lts/erbium`のNode.jsをインストール
- direnvをインストール
- プロジェクトルート直下で`direnv allow .`を実行して`.envrc`を自動読込

<br />

## Serverless Frameworkのpreinstall(npm i -g ...)

Serverless Framework関連のパッケージは事前にグローバルモードでインストールしておきます。

```
npm i -g serverless serverless-localstack serverless-dotenv-plugin serverless-cloudformation-changesets
```

- serverless
- serverless-localstack
- serverless-dotenv-plugin
- serverless-cloudformation-changesets

Serverless Frameworkはグローバル環境で動かすことを前提としています。グローバル環境でないと正常に動作しないことがあるので注意してください。

グローバルモードでは`root`が所有する`{prefix}/lib/node_modules/`にパッケージがインストールされます。

`{prefix}`は通常は`/usr`または`/usr/local`または`/opt/homebrew`です。

<br />

## 開発環境へのデプロイ

事前準備が完了したら`sls deploy`コマンドで AWS リソースをデプロイできます。
開発環境は[localstack](https://github.com/localstack/localstack)を使っています。
AWS クラウドを使わなくても、擬似的に AWS リソースをローカルマシン上で作成できます。
localstack は[Docker Compose](https://docs.docker.jp/compose/toc.html)でDockerイメージを使って起動します。
docker-composeコマンドを使ってlocalstackを起動します。

```
docker-compose up --build
```

その後、Serverless Frameworkのデプロイコマンドでデプロイができます。
stageのデフォルトは`local`に設定されているので、省略した場合もlocalstackへデプロイされます。

```
sls deploy --stage local
```

stage に`dev`を指定した場合も、localstackへデプロイされる設定になっています。

```
sls deploy --stage dev
```

`local`または`dev`でデプロイした際の環境変数は`.env`（dotenv）に設定されたものが読み込まれます。
ダミー値を入れているので、適宜書き換えてください。

ただしメール受信ができないため、localstackで検証できるのはServerless Frameworkで作成する AWS リソースのみが対象です。実際にメールを受信してSlackへ通知させるためには、後述するAWSクラウドの設定が必要です。

<br />
<br />

# 🌏 AWSクラウドで使うための事前準備

## AWSアカウントIDを取得

AWSアカウントIDをコンソールから取得します。IAMのポリシー設定のため、デプロイ時に指定が必要です。

<br />

## Slack Incoming WebhookのURLを取得

通知したいSlackのワークスペースでSlackアプリを作成してIncoming WebhookのURLを取得します。
同じく、デプロイ時に指定が必要です。

<br />

## AWS 環境へのデプロイ

AWSへデプロイする場合、stageに`st`または`prod`のいずれかを指定します。ステージング及び本番環境への環境変数適用はdeploy時にオプション引数で設定します。デプロイ時にSlackのURLとAWSアカウントIDのオプションを指定してください。指定が無い場合、`.env`に設定されたダミー値が設定されます。

```
sls deploy --stage st --awsAccountId 000000000000 --slackHookUrl https://hooks.slack.com/services/.../.../...
```

AWS環境へデプロイすると、LambdaやS3をはじめとするAWSリソースがAWSクラウド上に作成されます。後述するAmazon SESで設定でメール受信した際に動かすLambda、及び、保存先のS3を指定します。

<br />

## Amazon SESの設定

Amazon SESの受信メールサービスは利用できるリージョンが限られています。（2021 年 3 月現在）

| Region Name           | Region    | Receiving Endpoint                   |
| --------------------- | --------- | ------------------------------------ |
| US East (N. Virginia) | us-east-1 | inbound-smtp.us-east-1.amazonaws.com |
| US West (Oregon)      | us-west-2 | inbound-smtp.us-west-2.amazonaws.com |
| Europe (Ireland)      | eu-west-1 | inbound-smtp.eu-west-1.amazonaws.com |

東京リージョン（`ap-northeast-1`）では利用できないので注意してください。（メール送信であれば利用可）

デプロイ先のリージョンは`.env`のファイル内で`us-east-1`を設定しています。必要に応じて変更してください。

AWSコンソールから利用するリージョンのSESへドメインの登録を行います。ドメインのネームサーバーにAWSのRoute53を使っている場合、登録を進めていくことで必要な DNSレコードが自動的に設定されます。（Route53以外のネームサーバーの場合、手動で設定が必要です）

ドメイン登録後、該当ドメインへの受信メール設定を行います。メールを受信した際に、Lambda関数が呼び出され、S3へのメールが保存されるように設定します。

<br />
<br />

# 動作確認

問題なく設定されていれば、登録したドメインにメールを送信するとIncoming Webhookで設定したSlackのチャンネルにメール内容が通知されます。通知条件や通知テンプレートはLambda上で適宜カスタマイズしてお使いください。

<br />
<br />
