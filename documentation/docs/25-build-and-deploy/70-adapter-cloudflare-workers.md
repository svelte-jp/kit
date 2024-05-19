---
title: Cloudflare Workers
---

[Cloudflare Workers](https://workers.cloudflare.com/) にデプロイする場合は、[`adapter-cloudflare-workers`](https://github.com/sveltejs/kit/tree/main/packages/adapter-cloudflare-workers) を使用します。

> Unless you have a specific reason to use `adapter-cloudflare-workers`, it's recommended that you use `adapter-cloudflare` instead. Both adapters have equivalent functionality, but Cloudflare Pages offers features like GitHub integration with automatic builds and deploys, preview deployments, instant rollback and so on.

## 使い方 <!--usage-->

`npm i -D @sveltejs/adapter-cloudflare-workers` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare-workers';

export default {
	kit: {
		adapter: adapter({
      config: '<your-wrangler-name>.toml',
      platformProxy: {
        persist: './your-custom-path'
      }
    })
	}
};
```

## Options

### config

Path to your custom `wrangler.toml` config file.

### platformProxy

Preferences for the emulated `platform.env` local bindings. See the [getPlatformProxy](https://developers.cloudflare.com/workers/wrangler/api/#syntax) Wrangler API documentation for a full list of options.

## 基本設定 <!--basic-configuration-->

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
wrangler deploy
```

## カスタム設定 <!--custom-config-->

If you would like to use a config file other than `wrangler.toml` you can specify so using the [`config` option](#options-config).

[Node.js 互換](https://developers.cloudflare.com/workers/runtime-apis/nodejs/#enable-nodejs-from-the-cloudflare-dashboard) を有効化したい場合は、`wrangler.toml` で  "nodejs_compat" フラグを追加してください:

```toml
/// file: wrangler.toml
compatibility_flags = [ "nodejs_compat" ]
```

## Runtime APIs

[`env`](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#parameters) オブジェクトにはあなたのプロジェクトの [bindings](https://developers.cloudflare.com/pages/platform/functions/bindings/) が含まれており、KV/DO namespaces などで構成されています。これは `platform` プロパティを介して [`context`](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/#contextwaituntil)、[`caches`](https://developers.cloudflare.com/workers/runtime-apis/cache/)、[`cf`](https://developers.cloudflare.com/workers/runtime-apis/request/#the-cf-property-requestinitcfproperties) と一緒に SvelteKit に渡されます。つまり、hooks とエンドポイントでこれらにアクセスできるということです:

```js
// @errors: 7031
export async function POST({ request, platform }) {
	const x = platform.env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName('x');
}
```

> 環境変数については、SvelteKit の組み込みの `$env` モジュールの使用を推奨します。

バインディングの型宣言を含めるには、、`src/app.d.ts` でこれらを参照します:

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

### Testing Locally

Cloudflare Workers specific values in the `platform` property are emulated during dev and preview modes. Local [bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) are created based on the configuration in your `wrangler.toml` file and are used to populate `platform.env` during development and preview. Use the adapter config [`platformProxy` option](#options-platformproxy) to change your preferences for the bindings.

For testing the build, you should use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler) **version 3**. Once you have built your site, run `wrangler dev`.

## トラブルシューティング <!--troubleshooting-->

### Worker size limits

Workers にデプロイする場合、SvelteKit が生成したサーバーは1つのファイルにバンドルされます。minify 後に Worker が [そのサイズの上限](https://developers.cloudflare.com/workers/platform/limits/#worker-size) を超過する場合、Wrangler が Worker の公開に失敗します。通常、この制限に引っかかることはほとんどありませんが、一部の大きいライブラリではこれが発生することがあります。その場合、大きいライブラリをクライアントサイドでのみインポートするようにすることで、Worker のサイズを小さくすることができます。詳細は [FAQ](./faq#how-do-i-use-x-with-sveltekit-how-do-i-use-a-client-side-only-library-that-depends-on-document-or-window) をご覧ください。

### ファイルシステムにアクセスする <!--accessing-the-file-system-->

Cloudflare Workers では `fs` を使用することはできません。そうする必要があるルート(route)については[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)する必要があります。
