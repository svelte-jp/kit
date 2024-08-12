---
title: Node サーバー
---

スタンドアロンな Node サーバーを作る場合は、[`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) を使います。

## 使い方 <!--usage-->

`npm i -D @sveltejs/adapter-node` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
		adapter: adapter()
	}
};
```

## デプロイ(Deploying)

まず、`npm run build` でアプリをビルドします。これによって adapter のオプションで指定した出力ディレクトリ (デフォルトは `build`) に本番環境用のサーバーが作成されます。

アプリケーションを実行するには、出力ディレクトリ、プロジェクトの `package.json`、`node_modules` の本番向けの依存関係(production dependencies)が必要です。本番向けの依存関係は、`package.json` と `package-lock.json` をコピーしてから `npm ci --omit dev` を実行すると生成することができます (あなたのアプリが何の依存関係も持たない場合はこのステップをスキップできます)。そして、このコマンドでアプリを起動することができます:

```bash
node build
```

[Rollup](https://rollupjs.org) を使うと開発用の依存関係(Development dependencies)もアプリにバンドルされます。パッケージをバンドルするか外部化するかコントロールするには、そのパッケージを `package.json` の `devDependencies` か `dependencies` にそれぞれ配置します。

### レスポンスの圧縮 <!--compressing-responses-->

通常、サーバーからのレスポンスを圧縮したいでしょう。SSL やロードバランシングのためにリバースプロキシの後ろにサーバーを配置している場合は、通常はそちらのレイヤーで圧縮を処理したほうがパフォーマンスの向上につながります。Node.js はシングルスレッドだからです。

しかし、あなたが [custom server](#custom-server) を構築していて、そこに圧縮用のミドルウェアを追加したい場合は、[`@polka/compression`](https://www.npmjs.com/package/@polka/compression) を使用することをおすすめします。SvelteKit はレスポンスをストリーミングしますが、一般的な `compression` パッケージはストリーミングをサポートしていないため、使用するとエラーとなる可能性があります。

## 環境変数 <!--environment-variables-->

`dev` と `preview` のときは、SvelteKit は `.env` ファイル (または `.env.local` や `.env.[mode]`、[Vite によって決定されているもの](https://vitejs.dev/guide/env-and-mode.html#env-files)) から環境変数を読み取ります。

プロダクションでは、`.env` ファイルは自動的に読み取れらません。そうするには、プロジェクトに `dotenv` をインストールします…

```bash
npm install dotenv
```

…そしてビルドされたアプリを実行する前にそれを呼び出します:

```diff
- node build
+ node -r dotenv/config build
```

If you use Node.js v20.6+, you can use the [`--env-file`](https://nodejs.org/en/learn/command-line/how-to-read-environment-variables-from-nodejs) flag instead:

```diff
- node build
+ node --env-file=.env build
```

### `PORT`、`HOST`、`SOCKET_PATH` <!--port-host-and-socket-path-->

デフォルトでは、サーバーは `0.0.0.0`、port 3000 でコネクションを受け付けます。これは環境変数の `PORT` と `HOST` を使ってカスタマイズすることができます。

```
HOST=127.0.0.1 PORT=4000 node build
```

その他の方法としては、指定したソケットパスでコネクションを受け付けるようサーバーを設定することができます。環境変数の `SOCKET_PATH` を使用して設定する場合、環境変数の `HOST` と `PORT` は無視されます。

```
SOCKET_PATH=/tmp/socket node build
```

### `ORIGIN`、`PROTOCOL_HEADER`、`HOST_HEADER`、`PORT_HEADER` <!--origin-protocolheader-hostheader-and-port-header-->

HTTP は SvelteKit に現在リクエストされている URL を知るための信頼できる方法を提供しません。アプリがホストされている場所を Sveltekit に伝える最も簡単な方法は、環境変数 `ORIGIN` を設定することです:

```
ORIGIN=https://my.site node build

# or e.g. for local previewing and testing
ORIGIN=http://localhost:3000 node build
```

これにより、パス名 `/stuff` に対するリクエストは正しく `https://my.site/stuff` に解決されます。別の方法として、リクエストプロトコルとホストを SvelteKit に伝えるヘッダーを指定し、そこから origin URL を組み立てることもできます:

```
PROTOCOL_HEADER=x-forwarded-proto HOST_HEADER=x-forwarded-host node build
```

> [`x-forwarded-proto`](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Forwarded-Proto) と [`x-forwarded-host`](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/X-Forwarded-Host) は事実上の標準となっているヘッダーで、リバースプロキシー (ロードバランサーや CDN などを考えてみてください) を使用している場合に、オリジナルのプロトコルとホストを転送します。これらの変数は、あなたのサーバーが信頼できるリバースプロキシーの後ろにある場合にのみ設定すべきです。そうしないと、クライアントがこれらのヘッダーを偽装することが可能になってしまいます。
>
> プロキシーを非標準の port でホストしていて、リバースプロキシ−が `x-forwarded-port` をサポートしている場合は、`PORT_HEADER=x-forwarded-port` を設定することもできます。

`adapter-node` があなたのデプロイの URL を正しく判断することができない場合、[form actions](form-actions) を使用するとこのエラーが発生することがあります:

> クロスサイトの POST フォーム送信は禁止されています

### `ADDRESS_HEADER` と `XFF_DEPTH` <!--addressheader-and-xffdepth-->

hooks とエンドポイントに渡される [RequestEvent](types#public-types-requestevent) オブジェクトにはクライアントの IP アドレスを返す `event.getClientAddress()` 関数が含まれています。デフォルトでは、これは接続中の `remoteAddress` です。もしサーバーが1つ以上のプロキシー (例えばロードバランサー) の後ろにある場合、この値はクライアントの IP アドレスではなく、最も内側にあるプロキシーの IP アドレスを含むことになるため、アドレスを読み取るために `ADDRESS_HEADER` を指定する必要があります:

```
ADDRESS_HEADER=True-Client-IP node build
```

> ヘッダーは簡単に偽装されます。`PROTOCOL_HEADER` や `HOST_HEADER` と同様、これらを設定する前に[自分が何をしているのか知るべき](https://adam-p.ca/blog/2022/03/x-forwarded-for/)です。

`ADDRESS_HEADER` が `X-Forwarded-For` の場合、ヘッダーの値にはカンマで区切られた IP アドレスのリストが含まれます。環境変数 `XFF_DEPTH` には、あなたのサーバーの前に信頼できるプロキシーがいくつあるか指定する必要があります。例えば、3つの信頼できるプロキシーがある場合、プロキシー3はオリジナルのコネクションと最初の2つのプロキシーのアドレスを転送します:

```
<client address>, <proxy 1 address>, <proxy 2 address>
```

一番左のアドレスを読め、というガイドもありますが、これだと[スプーフィング(なりすまし)に対し脆弱](https://adam-p.ca/blog/2022/03/x-forwarded-for/)なままです:

```
<spoofed address>, <client address>, <proxy 1 address>, <proxy 2 address>
```

代わりに、信頼できるプロキシーの数を考慮して*右*から読み込みます。この場合、`XFF_DEPTH=3` を使用します。

> もし、一番左のアドレスを読む必要がある場合 (そしてスプーフィングを気にしない場合) — 例えば、位置情報サービスを提供する場合、つまり IP アドレスが*信頼できる*ことよりも*リアル*であることが重要な場合、アプリの中で `x-forwarded-for` ヘッダーを検査することでそれが可能です。

### `BODY_SIZE_LIMIT`

ストリーミング中も含め、受け付けるリクエストボディの最大サイズを byte で指定します。ボディサイズの指定には単位を使用することができます。キロバイトには (`K`)、メガバイトには (`M`)、ギガバイトには (`G`) です。例えば、`512K` や `1M` のようにします。デフォルトは 512キロバイト です。もっと高度な設定が必要な場合は、このオプションの値を `Infinity` (adapter が古いバージョンの場合は 0) にして無効化し、[`handle`](hooks#server-hooks-handle) にカスタムのチェックを実装することができます。

### `SHUTDOWN_TIMEOUT`

The number of seconds to wait before forcefully closing any remaining connections after receiving a `SIGTERM` or `SIGINT` signal. Defaults to `30`. Internally the adapter calls [`closeAllConnections`](https://nodejs.org/api/http.html#servercloseallconnections). See [Graceful shutdown](#graceful-shutdown) for more details.

### `IDLE_TIMEOUT`

When using systemd socket activation, `IDLE_TIMEOUT` specifies the number of seconds after which the app is automatically put to sleep when receiving no requests. If not set, the app runs continuously. See [Socket activation](#socket-activation) for more details.

## Options

この adapter は様々なオプションで設定を行うことができます:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
		adapter: adapter({
			// default options are shown
			out: 'build',
			precompress: true,
			envPrefix: ''
		})
	}
};
```

### out

サーバーをビルドするディレクトリです。デフォルトは `build` です。つまり、`node build` を指定すると、サーバが作成されローカルで起動します。

### precompress

アセットやプリレンダリングされたページを gzip や brotli を使って事前圧縮(precompress)するのを有効にします。デフォルトは `true` です。

### envPrefix

デプロイの設定に使用される環境変数の名前を変更する必要がある場合 (例えば、あなたのコントロール下にない環境変数との競合を解消するため)、接頭辞(prefix)を指定することができます:

```js
envPrefix: 'MY_CUSTOM_';
```

```sh
MY_CUSTOM_HOST=127.0.0.1 \
MY_CUSTOM_PORT=4000 \
MY_CUSTOM_ORIGIN=https://my.site \
node build
```

## Graceful shutdown

By default `adapter-node` gracefully shuts down the HTTP server when a `SIGTERM` or `SIGINT` signal is received. It will:

1. reject new requests ([`server.close`](https://nodejs.org/api/http.html#serverclosecallback))
2. wait for requests that have already been made but not received a response yet to finish and close connections once they become idle ([`server.closeIdleConnections`](https://nodejs.org/api/http.html#servercloseidleconnections))
3. and finally, close any remaining connections that are still active after [`SHUTDOWN_TIMEOUT`](#environment-variables-shutdown-timeout) seconds. ([`server.closeAllConnections`](https://nodejs.org/api/http.html#servercloseallconnections))

> If you want to customize this behaviour you can use a [custom server](#custom-server).

You can listen to the `sveltekit:shutdown` event which is emitted after the HTTP server has closed all connections. Unlike Node's `exit` event, the `sveltekit:shutdown` event supports asynchronous operations and is always emitted when all connections are closed even if the server has dangling work such as open database connections.

```js
// @errors: 2304
process.on('sveltekit:shutdown', async (reason) => {
  await jobs.stop();
  await db.close();
});
```

The parameter `reason` has one of the following values:

- `SIGINT` - shutdown was triggered by a `SIGINT` signal
- `SIGTERM` - shutdown was triggered by a `SIGTERM` signal
- `IDLE` - shutdown was triggered by [`IDLE_TIMEOUT`](#environment-variables-idle-timeout)

## Socket activation

Most Linux operating systems today use a modern process manager called systemd to start the server and run and manage services. You can configure your server to allocate a socket and start and scale your app on demand. This is called [socket activation](http://0pointer.de/blog/projects/socket-activated-containers.html). In this case, the OS will pass two environment variables to your app — `LISTEN_PID` and `LISTEN_FDS`. The adapter will then listen on file descriptor 3 which refers to a systemd socket unit that you will have to create.

> You can still use [`envPrefix`](#options-envprefix) with systemd socket activation. `LISTEN_PID` and `LISTEN_FDS` are always read without a prefix.

To take advantage of socket activation follow these steps.

1. Run your app as a [systemd service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html). It can either run directly on the host system or inside a container (using Docker or a systemd portable service for example). If you additionally pass an [`IDLE_TIMEOUT`](#environment-variables-idle-timeout) environment variable to your app it will gracefully shutdown if there are no requests for `IDLE_TIMEOUT` seconds. systemd will automatically start your app again when new requests are coming in.

```ini
/// file: /etc/systemd/system/myapp.service
[Service]
Environment=NODE_ENV=production IDLE_TIMEOUT=60
ExecStart=/usr/bin/node /usr/bin/myapp/build
```

2. Create an accompanying [socket unit](https://www.freedesktop.org/software/systemd/man/latest/systemd.socket.html). The adapter only accepts a single socket.

```ini
/// file: /etc/systemd/system/myapp.socket
[Socket]
ListenStream=3000

[Install]
WantedBy=sockets.target
```

3. Make sure systemd has recognised both units by running `sudo systemctl daemon-reload`. Then enable the socket on boot and start it immediately using `sudo systemctl enable --now myapp.socket`. The app will then automatically start once the first request is made to `localhost:3000`.

## カスタムサーバー <!--custom-server-->

この adapter は、ビルドのディレクトリに2つのファイルを作成します — `index.js` と `handler.js` です。デフォルトのビルドのディレクトリを使用している場合、`node build` などで `index.js` を実行すると、設定された port でサーバーが起動されます。

別の方法として、[Express](https://github.com/expressjs/express)、[Connect](https://github.com/senchalabs/connect)、[Polka](https://github.com/lukeed/polka) (またはビルトインの [`http.createServer`](https://nodejs.org/dist/latest/docs/api/http.html#httpcreateserveroptions-requestlistener)) を使用するためのハンドラーをエクスポートする `handler.js` ファイルをインポートし、独自のサーバーをセットアップすることもできます。

```js
// @errors: 2307 7006
/// file: my-server.js
import { handler } from './build/handler.js';
import express from 'express';

const app = express();

// add a route that lives separately from the SvelteKit app
app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

app.listen(3000, () => {
	console.log('listening on port 3000');
});
```
