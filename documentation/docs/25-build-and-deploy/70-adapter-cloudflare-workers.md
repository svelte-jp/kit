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
		adapter: adapter()
	}
};
```

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

`wrangler.toml` 以外の設定ファイルを使用したい場合は、以下のようにします:

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

## 環境変数 <!--environment-variables-->

KV/DO namespaces などを含んでいる [`env`](https://developers.cloudflare.com/workers/runtime-apis/fetch-event#parameters) オブジェクトは、`context` や `caches` と一緒に `platform` プロパティ経由で SvelteKit に渡されます。つまり、hooks とエンドポイントの中でアクセスできるということです:

```js
// @errors: 7031
export async function POST({ request, platform }) {
	const x = platform.env.YOUR_DURABLE_OBJECT_NAMESPACE.idFromName('x');
}
```

> 環境変数については、SvelteKit の組み込みの `$env` モジュールの使用を推奨します。

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

### Testing Locally

`platform.env` is only available in the final build and not in dev mode. For testing the build, you can use [wrangler](https://developers.cloudflare.com/workers/cli-wrangler). Once you have built your site, run `wrangler dev`. Ensure you have your [bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) in your `wrangler.toml`. Wrangler version 3 is recommended.
`platform.env` は最終的なビルドでのみ利用可能であり、開発モード (dev mode) では利用できません。ビルドをテストするには、[wrangler](https://developers.cloudflare.com/workers/cli-wrangler) をお使いいただけます。サイトをビルドし、`wrangler dev` を実行してください。[bindings](https://developers.cloudflare.com/workers/wrangler/configuration/#bindings) が `wrangler.toml` にあることを確認してください。Wrangler のバージョンは 3 を推奨します。

## トラブルシューティング <!--troubleshooting-->

### Worker size limits

Workers にデプロイする場合、SvelteKit が生成したサーバーは1つのファイルにバンドルされます。minify 後に Worker が [そのサイズの上限](https://developers.cloudflare.com/workers/platform/limits/#worker-size) を超過する場合、Wrangler が Worker の公開に失敗します。通常、この制限に引っかかることはほとんどありませんが、一部の大きいライブラリではこれが発生することがあります。その場合、大きいライブラリをクライアントサイドでのみインポートするようにすることで、Worker のサイズを小さくすることができます。詳細は [FAQ](./faq#how-do-i-use-x-with-sveltekit-how-do-i-use-a-client-side-only-library-that-depends-on-document-or-window) をご覧ください。

### ファイルシステムにアクセスする <!--accessing-the-file-system-->

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。
