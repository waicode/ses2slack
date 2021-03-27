![ses2slack](https://i.gyazo.com/27885f31d143fce88ff1c20b2d880a28.png "ses2slack")

Amazon Simple Email Service ([Amazon SES](https://aws.amazon.com/jp/ses/)) で受信したメールを Slack へ通知する AWS Lambda アプリケーションです。AWS リソースの構成管理及びモジュールのデプロイには[Serverless Framework](https://www.serverless.com/)を使っています。

<br />

# 💌 見逃せないメールを Slack へ簡単に通知

最近ではサービスの障害通知を Slack に送ることはよくあると思います。メールよりも Slack をはじめとするチャットサービスの方が、常に意識を向けているので、異常が起きた事にすぐに気付けますよね。

しかしながら、古いシステムの場合は障害通知はメールで行っているケースも多いのではないでしょうか。もちろん、障害通知の仕組み自体を改修すれば Slack へ送ることもできるとは思います。でも、優先度の高い課題が山積みの中で、そんなところまで手が回らないよ…というケースがほとんどではないでしょうか。

ses2slack を使えば Amazon SES で受信したメールをそのまま slack へ通知できます。

受信したメール情報は Lambda を介して Slack へ通知されるので、メールの送信元や件名、本文を解析して、特定のメールだけ Slack へ通知させることも可能です。

<br />

# 📮 アーキテクチャはサーバレス

以下の AWS リソースは Serverless Framework で作成されます。

- メール受信時に起動される Lambda
- 受信メールが保存される S3
- Slack 通知先を格納する Secret Manager

Amazon SES は手動で AWS コンソール画面から設定します。メール受信のためにドメイン登録及び Route53 への DNS レコード設定が必要です。

Slack のチャンネル通知先 URL（Incoming Webhook）は Slack アプリ設定画面から取得してください。

<br />

# 📥 事前準備

## Amazon SES の設定

TODO: 要記載

Amazon SES の受信メールサービスは 利用できるリージョンが限られています。（2021 年 3 月現在）

| Region Name           | Region    | Receiving Endpoint                   |
| --------------------- | --------- | ------------------------------------ |
| US East (N. Virginia) | us-east-1 | inbound-smtp.us-east-1.amazonaws.com |
| US West (Oregon)      | us-west-2 | inbound-smtp.us-west-2.amazonaws.com |
| Europe (Ireland)      | eu-west-1 | inbound-smtp.eu-west-1.amazonaws.com |

東京リージョン（ap-northeast-1）では利用できないので注意してください。
デフォルトのリージョンは`us-east-1`を設定しています。

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

<br />

# 🏷 デプロイと環境変数

事前準備が完了したら`sls deploy`コマンドで AWS リソースをデプロイできます。
開発環境は[localstack](https://github.com/localstack/localstack)を使っています。
AWS クラウドを使わなくても、擬似的に AWS リソースをローカルマシン上で作成できます。
localstack は[Docker Compose](https://docs.docker.jp/compose/toc.html)で Docker イメージを使って起動します。
docker-compose コマンドを使って localstack を起動します。

```
docker-compose up --build
```

その後、Serverless Framework のデプロイコマンドでデプロイができます。
stage のデフォルトは`local`に設定されているので、省略した場合も localstack へデプロイされます。

```
sls deploy --stage local
```

stage に`dev`を指定した場合も、localstack へデプロイされる設定になっています。

```
sls deploy --stage dev
```

`local`または`dev`でデプロイした際の環境変数は`.env`（dotenv）に設定されたものが読み込まれます。
ダミー値を入れているので、適宜書き換えてください。

AWS クラウドへデプロイする場合、stage に`st`または`prod`のいずれかを指定します。
ステージング及び本番環境への環境変数適用は deploy 時にオプション引数で設定します。
Slack の URL や AWS アカウント ID のオプション指定が必須となります。

```
sls deploy --stage st --awsAccountId 000000000000 --slackHookUrl https://hooks.slack.com/services/.../.../...
```

<br />
