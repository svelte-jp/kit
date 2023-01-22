---
title: Cloudflare Workers
---

[Cloudflare Workers](https://workers.cloudflare.com/) にデプロイする場合は、[`adapter-cloudflare-workers`](https://github.com/sveltejs/kit/tree/master/packages/adapter-cloudflare-workers) を使用します。

この adapter を使用する特別な理由がない限り、代わりに [`adapter-cloudflare`](adapter-cloudflare) を使用することをおすすめします。

> [Wrangler v2](https://developers.cloudflare.com/workers/wrangler/get-started/) が必要です。

## 使い方

`npm i -D @sveltejs/adapter-cloudflare-workers` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare-workers';

export default {
	kit: {
		adapter: adapter()
	}
};
```

## 基本設定

この adapter では、プロジェクトの root に [wrangler.toml](https://developers.cloudflare.com/workers/platform/sites/configuration) ファイルを置くことを想定しています。内容としては以下のようなものです:

```toml
/// file: wrangler.toml
name = "<your-service-name>"
account_id = "<your-account-id>"

main = "./.cloudflare/worker.js"
site.bucket = "./.cloudflare/public"

build.command = "npm run build"

compatibility_date = "2021-11-12"
workers_dev = true
```

`<your-service-name>` は何でも構いません。`<your-account-id>` は、[Cloudflare dashboard](https://dash.cloudflare.com) にログインし、URL の末尾から取得できます:

```
https://dash.cloudflare.com/<your-account-id>
```

> `.cloudflare` ディレクトリ (または `main` と `site.bucket` に指定したディレクトリ) を `.gitignore` に追加する必要があります。

[wrangler](https://developers.cloudflare.com/workers/wrangler/get-started/) をインストールしてログインする必要がありますが、もしまだやっていなければ:

```
npm i -g wrangler
wrangler login
```

その後、アプリをビルドしデプロイすることができます:

```sh
wrangler publish
```

## カスタム設定

If you would like to use a config file other than `wrangler.toml`, you can do like so:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare-workers';

export default {
	kit: {
		adapter: adapter({ config: '<your-wrangler-name>.toml' })
	}
};
```

## 環境変数

KV/DO namespaces などを含んでいる [`env`](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#parameters) オブジェクトは、`context` や `caches` と一緒に `platform` プロパティ経由で SvelteKit に渡されます。つまり、hooks とエンドポイントの中でアクセスできるということです:

```js
// @errors: 7031
export async function POST({ request, platform }) {
	const x = platform.env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName('x');
}
```

これらの型をアプリで使えるようにするには、`src/app.d.ts` でこれらを参照します:

```diff
/// file: src/app.d.ts
declare global {
	namespace App {
		interface Platform {
+			env?: {
+				YOUR_KV_NAMESPACE: KVNamespace;
+				YOUR_DURABLE_OBJECT_NAMESPACE: DurableObjectNamespace;
+			};
		}
	}
}

export {};
```

> `platform.env` は本番向けビルドでのみ利用することができます。ローカルでテストするには [wrangler](https://developers.cloudflare.com/workers/cli-wrangler) を使ってください

## トラブルシューティング

### ファイルシステムにアクセスする

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。