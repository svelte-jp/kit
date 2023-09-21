---
title: Node サーバー
---

スタンドアロンな Node サーバーを作る場合は、[`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) を使います。

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

## 環境変数 <!--environment-variables-->

`dev` と `preview` のときは、SvelteKit は `.env` ファイル (または `.env.local` や `.env.[mode]`、[Vite によって決定されているもの](https://vitejs.dev/guide/env-and-mode.html#env-files)) から環境変数を読み取ります。

プロダクションでは、`.env` ファイルは自動的に読み取れらません。そうするには、プロジェクトに `dotenv` をインストールします…

```bash
npm install dotenv
```

…そしてビルドされたアプリを実行する前にそれを呼び出します:

```diff
-node build
+node -r dotenv/config build
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

### `ORIGIN`、`PROTOCOL_HEADER`、`HOST_HEADER` <!--origin-protocolheader-and-hostheader-->

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

ストリーミング中も含め、受け付けるリクエストボディの最大サイズを byte で指定します。デフォルトは 512kb です。もっと高度な設定が必要な場合は、このオプションの値を 0 にして無効化し、[`handle`](hooks#server-hooks-handle) にカスタムのチェックを実装することができます。

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
			precompress: false,
			envPrefix: '',
			polyfill: true
		})
	}
};
```

### out

サーバーをビルドするディレクトリです。デフォルトは `build` です。つまり、`node build` を指定すると、サーバが作成されローカルで起動します。

### precompress

アセットやプリレンダリングされたページを gzip や brotli を使って事前圧縮(precompress)するのを有効にします。デフォルトは `false` です。

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

### polyfill

ビルドが存在しないモジュールの polyfill を読み込むかどうかをコントロールします。デフォルトは `true` で、Node 18.11 以降を使用している場合にのみ無効にしてください。

注意事項: Node のビルトインの `crypto` global を Node 18 で使用するには、`--experimental-global-webcrypto` フラグを使用する必要があります。Node 20 ではこのフラグは必要ありません。

## カスタムサーバー <!--custom-server-->

この adapter は、ビルドのディレクトリに2つのファイルを作成します — `index.js` と `handler.js` です。デフォルトのビルドのディレクトリを使用している場合、`node build` などで `index.js` を実行すると、設定された port でサーバーが起動されます。

別の方法として、[Express](https://github.com/expressjs/expressjs.com)、[Connect](https://github.com/senchalabs/connect)、[Polka](https://github.com/lukeed/polka) (またはビルトインの [`http.createServer`](https://nodejs.org/dist/latest/docs/api/http.html#httpcreateserveroptions-requestlistener)) を使用するためのハンドラーをエクスポートする `handler.js` ファイルをインポートし、独自のサーバーをセットアップすることもできます。

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

## トラブルシューティング <!--troubleshooting-->

### サーバーが終了する前にクリーンアップするための hook はありますか？ <!--is-there-a-hook-for-cleaning-up-before-the-server-exits-->

SvelteKit にはこれに対応するためのビルトインで組み込まれているものはありません。なぜなら、このようなクリーンアップの hook はあなたの実行環境に大きく依存しているからです。Node の場合は、ビルトインの `process.on(..)` を使用して、サーバーが終了する前に実行されるコールバックを実装することができます:

```js
// @errors: 2304 2580
function shutdownGracefully() {
	// anything you need to clean up manually goes in here
	db.shutdown();
}

process.on('SIGINT', shutdownGracefully);
process.on('SIGTERM', shutdownGracefully);
```
