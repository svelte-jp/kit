---
title: Cloudflare Pages
---

[Cloudflare Pages](https://developers.cloudflare.com/pages/) にデプロイする場合は、[`adapter-cloudflare`](https://github.com/sveltejs/kit/tree/master/packages/adapter-cloudflare) を使用します。

[`adapter-auto`](/docs/adapter-auto) を使用している場合、この adapter は自動でインストールされますが、それよりもこの adapter 自体をプロジェクトに追加することをおすすめします。`event.platform` が自動で型付けされるからです。

## 比較

- `adapter-cloudflare` – SvelteKit の全ての機能をサポートします; [Cloudflare Pages](https://blog.cloudflare.com/cloudflare-pages-goes-full-stack/) 向けにビルドします
- `adapter-cloudflare-workers` – SvelteKit の全ての機能をサポートします; Cloudflare Workers 向けにビルドします
- `adapter-static` – クライアントサイドの静的なアセットを生成するのみです; Cloudflare Pages と互換性があります

> 特別な理由が無い限り、`adapter-cloudflare-workers` ではなく、この adapter を使用することをおすすめします。どちらの adapter も機能としては同等ですが、Cloudflare Pages は、GitHub インテグレーションによる自動ビルドや自動デプロイ、プレビューデプロイ、即時ロールバックなどの機能を提供します。

## 使い方

`npm i -D @sveltejs/adapter-cloudflare` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-cloudflare';

export default {
	kit: {
		adapter: adapter()
	}
};
```

## デプロイメント(Deployment)

Cloudflare Pages の始め方は、[Get Started Guide](https://developers.cloudflare.com/pages/get-started) に従ってください。

プロジェクトのセッティングを設定するときは、以下のセッティングを使用しなければなりません:

- **Framework preset** – None
- **Build command** – `npm run build` または `svelte-kit build`
- **Build output directory** – `.svelte-kit/cloudflare`
- **Environment variables**
	- `NODE_VERSION`: `16`

> "production" 環境と "preview" 環境のどちらにも、環境変数 `NODE_VERSION` を追加する必要があります。これは、プロジェクトセットアップ時や、後で Pages プロジェクトのセッティングで追加できます。SvelteKit は Node `16.14` 以降を要求するため、`NODE_VERSION` の値として `16` を使用する必要があります。

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

## Notes

プロジェクトの root にある `/functions` ディレクトリに含まれる関数はデプロイメントには含まれず、[1つの `_worker.js` ファイル](https://developers.cloudflare.com/pages/platform/functions/#advanced-mode)にコンパイルされます。関数は、あなたの SvelteKit アプリの [サーバーエンドポイント(server endpoints)](https://kit.svelte.jp/docs/routing#server) として実装する必要があります。

Cloudflare Pages 固有の `_headers` ファイルと `_redirects` ファイルについては、`/static` フォルダに置くことで、静的アセットのレスポンス (画像など) に使用することができます。

しかし、SvelteKit が動的にレンダリングするレスポンスには効果がありません。この場合にカスタムヘッダーやリダイレクトレスポンスを返すには、[サーバーエンドポイント(server endpoints)](https://kit.svelte.jp/docs/routing#server) や [`handle`](https://kit.svelte.jp/docs/hooks#server-hooks-handle) hook から返す必要があります。

## トラブルシューティング

### ファイルシステムにアクセスする

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。
