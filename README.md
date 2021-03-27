![ses2slack](https://i.gyazo.com/27885f31d143fce88ff1c20b2d880a28.png "ses2slack")

Amazon Simple Email Service ([Amazon SES](https://aws.amazon.com/jp/ses/)) で受信したメールを Slack へ通知する AWS Lambda アプリケーションです。AWS リソースの構成管理及びモジュールのデプロイには[Serverless Framework](https://www.serverless.com/)を使っています。

<br />

# 💌 見逃せないメールを Slack へ

最近では、サービスの障害通知を Slack に送ることはよくあると思います。メールよりも Slack をはじめとするチャットサービスの方が、常に意識を向けているので、異常が起きた事にすぐに気付けますよね。

でも、古いシステムの場合は障害通知はメールで行っているケースも多いのではないでしょうか。もちろん、通知の仕組み自体を改修すれば Slack へ送ることはできます。しかし「優先度の高い課題が山積みの中で、そんなところまで手が回らないよ…」というケースも多いのではないでしょうか。

ses2slack を使えば **Amazon SES で受信したメールをそのまま slack へ通知** できます。

受信したメール情報は Lambda を介して Slack へ通知されるので、メールの送信元や件名、本文を解析して、特定のメールだけ Slack へ通知させることも可能です。

<br />

# 📮 アーキテクチャはサーバレス

以下の AWS リソースは Serverless Framework で作成されます。

- メール受信時に起動される Lambda
- 受信メールが保存される S3
- Slack 通知先を格納する Secret Manager

Amazon SES はメール受信のためにドメイン登録及び Route53 への DNS レコード設定が必要です。そのため、SES は手動で AWS コンソールから設定します。

Slack のチャンネル通知先 URL（Incoming Webhook）は Slack アプリ設定画面から取得して、アプリケーションのデプロイ時に設定します。

<br />

# 📥 開発環境の事前準備

## Node.js/npm の preinstall

[Serverless Framework](https://www.serverless.com/) を動かすための Node.js は 12.x 系（lts/erbium）を使っています。
開発環境における Node.js 自体バージョンは [nvm](https://github.com/nvm-sh/nvm) で管理しています。
12.x 系のバージョンを使うために nvm の設定ファイル`.nvmrc`でバージョンを指定しています。
プロジェクトフォルダ移動時に`.nvmrc`の設定を自動適用させるために[direnv](https://github.com/direnv/direnv)の`.envrc`を使って`nvm use`（`.nvmrc`の読込み）を行います。

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

## 開発環境へのデプロイ

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

ただしメール受信ができないため、localstack で検証できるのは Serverless Framework で作成する AWS リソースのみが対象です。実際にメールを受信して Slack へ通知させるためには、後述する AWS クラウドの設定が必要です。

<br />

# 🌏 AWS クラウドで使うための事前準備

## AWS アカウント ID を取得

AWS アカウント ID をコンソールから取得します。IAM のポリシー設定のため、デプロイ時に指定が必要です。

## Slack Incoming Webhook の URL を取得

通知したい Slack のワークスペースで Slack アプリを作成して Incoming Webhook の URL を取得します。
同じく、デプロイ時に指定が必要です。

## AWS 環境へのデプロイ

AWS クラウドへデプロイする場合、stage に`st`または`prod`のいずれかを指定します。ステージング及び本番環境への環境変数適用は deploy 時にオプション引数で設定します。デプロイ時に Slack の URL と AWS アカウント ID のオプションを指定してください。指定が無い場合、`.env`に設定されたダミー値が設定されます。

```
sls deploy --stage st --awsAccountId 000000000000 --slackHookUrl https://hooks.slack.com/services/.../.../...
```

AWS 環境へデプロイすると、Lambda や S3 をはじめとする AWS リソースが AWS クラウド上に作成されます。後述する Amazon SES で設定でメール受信した際に動かす Lambda、及び、保存先の S3 を指定します。

## Amazon SES の設定

Amazon SES の受信メールサービスは利用できるリージョンが限られています。（2021 年 3 月現在）

| Region Name           | Region    | Receiving Endpoint                   |
| --------------------- | --------- | ------------------------------------ |
| US East (N. Virginia) | us-east-1 | inbound-smtp.us-east-1.amazonaws.com |
| US West (Oregon)      | us-west-2 | inbound-smtp.us-west-2.amazonaws.com |
| Europe (Ireland)      | eu-west-1 | inbound-smtp.eu-west-1.amazonaws.com |

東京リージョン（`ap-northeast-1`）では利用できないので注意してください。（メール送信であれば利用可）

デプロイ先のリージョンは`.env`のファイル内で`us-east-1`を設定しています。必要に応じて変更してください。

AWS コンソールから利用するリージョンの SES へドメインの登録を行います。ドメインのネームサーバーに AWS の Route53 を使っている場合、登録を進めていくことで必要な DNS レコードが自動的に設定されます。（Route53 以外のネームサーバーの場合、手動で設定が必要です）

ドメイン登録後、該当ドメインへの受信メール設定を行います。メールを受信した際に、Lambda 関数が呼び出され、S3 へのメールが保存されるように設定します。

# 動作確認

問題なく設定されていれば、登録したドメインにメールを送信すると Incoming Webhook で設定した Slack のチャンネルにメール内容が通知されます。通知条件や通知テンプレートは Lambda 上で適宜カスタマイズしてお使いください。

<br />
