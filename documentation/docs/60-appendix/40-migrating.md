---
title: Sapper からの移行
rank: 1
---

SvelteKit は Sapper の後継であり、その設計の多くの要素を共有しています。

もし、既存の Sapper アプリを SvelteKit に移行する予定がある場合、いくつかの変更が必要になります。移行する際には、[examples](additional-resources#examples) を見ていただくと参考になると思います。

## package.json

### type: "module"

`package.json` に `"type": "module"` を追加します。もし Sapper 0.29.3 以降を使用している場合は、インクリメンタルマイグレーションの一部として、このステップを他のステップとは別に行うことができます。

### dependencies

`polka` や `express` を使用している場合はそれを削除し、`sirv` や `compression` などのミドルウェア(middleware)も削除します。

### devDependencies

`devDependencies` から `sapper` を削除し、`@sveltejs/kit` と使用予定の [adapter](adapters)に置き換えます([次のセクション](migrating#project-files-configuration)をご覧ください)。

### scripts

`sapper` を参照しているスクリプトを全て更新します:

- `sapper build` は、Node [adapter](adapters) を使用した `vite build` に更新します 
- `sapper export` は、static [adapter](adapters) を使用した `vite build` に更新します 
- `sapper dev` は `vite dev` に更新します
- `node __sapper__/build` は `node build` に更新します

## プロジェクトファイル <!--project-files-->

アプリの大部分を占める `src/routes` の中はそのままで大丈夫ですが、いくつかのプロジェクトファイルを移動または更新する必要があります。

### Configuration

[こちら](configuration)に記載されている通り、`webpack.config.js` または `rollup.config.js` を `svelte.config.js` に置き換えてください。Svelte の preprocessor オプション は `config.preprocess` に移動してください。

[adapter](adapters) を追加する必要があります。`sapper build` は [adapter-node](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) とおおよそ同じで、`sapper export` は [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) とおおよそ同じですが、デプロイ先のプラットフォーム向けにデザインされた adapter を使用するのも良いでしょう。

[Vite](https://vitejs.dev) では自動的に処理されないファイルタイプのプラグインを使用している場合は、Vite において同等なことを行う方法を探し、[Vite config](project-structure#project-files-vite-config-js) に追加する必要があります。

### src/client.js

SvelteKit にはこのファイルに相当するものはありません。カスタムロジック(`sapper.start(...)` 以降) は、`+layout.svelte` ファイルで、`onMount` コールバック内に記述してくさい。

### src/server.js

`adapter-node` を使用する場合は、[custom server](adapter-node#custom-server) がこれと同等のものです。それ以外の場合は、同等のものに該当するものはありません。なぜなら SvelteKit アプリはサーバーレス環境でも実行可能だからです。

### src/service-worker.js

`@sapper/service-worker` からインポートするほとんどのものは、[`$service-worker`](modules#$service-worker) に同等なものがあります:

- `files` は変更されていません
- `routes` は削除されました
- `shell` は現在 `build` になりました
- `timestamp` は現在 `version` になりました

### src/template.html

`src/template.html` は `src/app.html` にリネームする必要があります。

`%sapper.base%`、`%sapper.scripts%`、`%sapper.styles%` を削除します。`%sapper.head%` を `%sveltekit.head%` に、`%sapper.html%` を `%sveltekit.body%` にそれぞれ置き換えます。`<div id="sapper">` はもう必要ありません。

### src/node_modules

Sapper アプリでよくあるパターンとして、内部ライブラリを `src/node_modules` 内のディレクトリに配置する、というものがあります。これは Vite だと動作しないため、代わりに [`src/lib`](modules#$lib) を使用します。

## ページとレイアウト <!--pages-and-layouts-->

### 名前が変わったファイル <!--renamed-files-->

ルート(Routes)は曖昧さをなくすためフォルダ名のみで構成されるようになり、`+page.svelte` までのフォルダ名がルート(route)に対応するようになりました。概要は [ルーティングのドキュメント](routing) をご参照ください。以下は 新/旧 の比較です:

| Old                       | New                       |
| ------------------------- | ------------------------- |
| routes/about/index.svelte | routes/about/+page.svelte |
| routes/about.svelte       | routes/about/+page.svelte |

カスタムのエラーページコンポーネントは `_error.svelte` から `+error.svelte` にリネームしてください。また、どの `_layout.svelte` ファイルも、同様に `+layout.svelte` にリネームしてください。[その他のファイルは無視されます](routing#other-files).

### Imports

`@sapper/app` からインポートしていた `goto`、`prefetch`、`prefetchRoutes` は、[`$app/navigation`](modules#$app-navigation) からインポートする `goto`、`preloadData`、`preloadCode` にそれぞれ置き換えてください。

`@sapper/app` からインポートしていた `stores` については置き換える必要があります — 以下の [Stores](migrating#pages-and-layouts-stores)) をご覧ください。

`src/node_modules` にあるディレクトリからインポートしてたファイルは、[`$lib`](modules#$lib) からのインポートに置き換えてください。

### Preload

以前と同様に、ページやレイアウトではレンダリングが行われる前にデータをロードできる関数をエクスポートすることができます。

この関数は `preload` から [`load`](load) にリネームされ、その API が変更されました。2 つの引数 — `page` と `session` — の代わりに、両方を 1 つにまとめた引数と、`fetch` (`this.fetch` からの置き換え)、そして新たに `stuff` オブジェクトが追加されました。

`this` オブジェクトはなくなり、その結果 `this.fetch`、`this.error`、`this.redirect` もなくなりました。代わりに、[`fetch`](load#making-fetch-requests) を input メソッドから使用できるようになり、[`error`](load#errors) と [`redirect`](load#redirects) の両方がスローされるようになりました。.
This function has been renamed from `preload` to [`load`](load), it now lives in a `+page.js` (or `+layout.js`) next to its `+page.svelte` (or `+layout.svelte`), and its API has changed. Instead of two arguments — `page` and `session` — there is a single `event` argument.

There is no more `this` object, and consequently no `this.fetch`, `this.error` or `this.redirect`. Instead, you can get [`fetch`](load#making-fetch-requests) from the input methods, and both [`error`](load#errors) and [`redirect`](load#redirects) are now thrown.

### Stores

Sapper では、提供されるストアをこのように参照していたかと思います:

```js
// @filename: ambient.d.ts
declare module '@sapper/app';

// @filename: index.js
// ---cut---
import { stores } from '@sapper/app';
const { preloading, page, session } = stores();
```

`page` と `session` ストアはまだ存在しています。`preloading` は、`from` プロパティと `to` プロパティを含む `navigating` ストアに置き換えられました。`page` は `url`、`params` を持つようになりましたが、`path` と `query` はありません。

SvelteKit では、それらにアクセスする方法が異なります。`stores` は `getStores` になりましたが、[`$app/stores`](modules#$app-stores) から直接 `navigating`、`page`、`session` をインポートできるので、ほとんどの場合は必要ありません。

### ルーティング <!--routing-->

ルート(routes) の正規表現はもうサポートされていません。代わりに、[advanced route matching](advanced-routing#matching) をお使いください。

### Segments

以前までは、レイアウトコンポーネントは子のセグメントを表す `segment` プロパティを受け取っていましたが、この機能は削除されました。より柔軟な `$page.url.pathname` の値を使用し、お望みのセグメントを取得してください。

### URLs

Sapper では、相対 URL は、現在のページに対してではなく、base URL (`basepath` オプションが使用されていない限り、大抵の場合は `/`) に対して解決されていました。

これによって問題が発生していましたが、SvelteKit ではもうそのようなことはありません。相対 URL が現在のページ (または `load` 関数の `fetch` URL の場合は移動先のページ) に対して解決されるようになりました。多くの場合、(例えば、`/` 始まるような) ルート相対な URL を使用するほうが簡単です。なぜなら、それらの意図がコンテキストに依存しないからです。

### &lt;a&gt; attributes

- `sapper:prefetch` は `data-sveltekit-preload-data` になりました
- `sapper:noscroll` は `data-sveltekit-noscroll` になりました

## Endpoints

Sapper では、[サーバールート(server routes)](routing#server) は、Node の `http` モジュール によって公開される `req` と `res` オブジェクト(または Polka や Express などのフレームワークが提供するその拡張版) を受け取っていました。

SvelteKit は、アプリが動作する場所に依存しないように設計されています(Node サーバーで動作し、サーバーレスプラットフォームや Cloudflare Worker でも同様に動作します)。そのため、もう `req` と `res` を直接扱いません。エンドポイントを、新しいシグネチャに合わせて更新する必要があります。

環境非依存な動作をサポートするため、グローバルコンテキストで `fetch` が利用できるようになり、`node-fetch` や `cross-fetch` などのサーバーサイドの fetch 実装をインポートする必要がなくなりました。

## インテグレーション <!--integrations-->

インテグレーションに関する詳細情報については [インテグレーション](./integrations) をご参照ください。

### HTML minifier

Sapper はデフォルトで `html-minifier` を含んでいました。SvelteKit はこれを含まないのですが、本番環境向けの依存関係(prod dependency)としてこれを追加し、[hook](hooks#server-hooks-handle) で使用することができます:

```js
// @filename: ambient.d.ts
/// <reference types="@sveltejs/kit" />
declare module 'html-minifier';

// @filename: index.js
// ---cut---
import { minify } from 'html-minifier';
import { building } from '$app/environment';

const minification_options = {
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	decodeEntities: true,
	html5: true,
	ignoreCustomComments: [/^#/],
	minifyCSS: true,
	minifyJS: false,
	removeAttributeQuotes: true,
	removeComments: false, // some hydration code needs comments, so leave them in
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true
};

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let page = '';

	return resolve(event, {
		transformPageChunk: ({ html, done }) => {
			page += html;
			if (done) {
				return building ? minify(page, minification_options) : page;
			}
		}
	});
}
```

サイトのプロダクションビルドをテストするのに `vite preview` を使用しているときは、`prerendering` が `false` となることにご注意ください。そのため、minify の結果を検証するには、ビルド済の HTML を直接確認する必要があります。
