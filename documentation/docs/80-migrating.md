---
title: Sapper からの移行
rank: 1
---

SvelteKit は Sapper の後継であり、その設計の多くの要素を共有しています。

もし、既存の Sapper アプリを SvelteKit に移行する予定がある場合、いくつかの変更が必要になります。移行する際には、[examples](https://kit.svelte.jp/docs#additional-resources-examples) を見ていただくと参考になると思います。

### package.json

#### type: "module"

`package.json` に `"type": "module"` を追加します。もし Sapper 0.29.3 以降を使用している場合は、インクリメンタルマイグレーションの一部として、このステップを他のステップとは別に行うことができます。

#### dependencies

`polka` や `express` を使用している場合はそれを削除し、`sirv` や `compression` などのミドルウェア(middleware)も削除します。

#### devDependencies

`devDependencies` から `sapper` を削除し、`@sveltejs/kit` と使用予定の [adapter](/docs/adapters)に置き換えます([次のセクション](/docs/migrating#project-files-configuration)をご覧ください)。

#### scripts

`sapper` を参照しているスクリプトを全て更新します:

- `sapper build` は、Node [adapter](/docs/adapters) を使用した [`svelte-kit build`](/docs/cli#svelte-kit-build) にします
- `sapper export` は、static [adapter](/docs/adapters) を使用した [`svelte-kit build`](/docs/cli#svelte-kit-build) にします
- `sapper dev` は [`svelte-kit dev`](/docs/cli#svelte-kit-dev) にします
- `node __sapper__/build` は `node build` にします

### プロジェクトファイル

アプリの大部分を占める `src/routes` の中はそのままで大丈夫ですが、いくつかのプロジェクトファイルを移動または更新する必要があります。

#### Configuration

[こちら](/docs/configuration)に記載されている通り、`webpack.config.js` または `rollup.config.js` を `svelte.config.js` に置き換えてください。Svelte の preprocessor オプション は `config.preprocess` に移動してください。

[adapter](/docs/adapters) を追加する必要があります。`sapper build` は [adapter-node](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) とおおよそ同じで、`sapper export` は [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) とおおよそ同じですが、デプロイ先のプラットフォーム向けにデザインされた adapter を使用するのも良いでしょう。

[Vite](https://vitejs.dev) では自動的に処理されないファイルタイプのプラグインを使用している場合は、Vite において同等なことを行う方法を探し、[Vite config](/docs/configuration#vite) に追加する必要があります。

#### src/client.js

SvelteKit にはこのファイルに相当するものはありません。カスタムロジック(`sapper.start(...)` 以降) は、`__layout.svelte` ファイルの `onMount` コールバック内に記述してくさい。

#### src/server.js

SvelteKit アプリはサーバーレス環境で動作することを可能にしているため、このファイルも直接相当するものはありません。ただし、[hooks module](/docs/hooks) を使用してセッションロジックを実装することはできます。

#### src/service-worker.js

`@sapper/service-worker` からインポートするほとんどのものは、[`$service-worker`](/docs/modules#$service-worker) に同等なものがあります:

- `files` は変更されていません
- `routes` は削除されました
- `shell` は現在 `build` になりました
- `timestamp` は現在 `version` になりました

#### src/template.html

`src/template.html` は `src/app.html` にリネームする必要があります。

`%sapper.base%`、`%sapper.scripts%`、`%sapper.styles%` は削除してください。`%sapper.head%` は `%svelte.head%` に、`%sapper.html%` は `%svelte.body%` にそれぞれ置き換えてください。`<div id="sapper">` はもう必要ありません。

#### src/node_modules

Sapper アプリでよくあるパターンとして、内部ライブラリを `src/node_modules` 内のディレクトリに配置する、というものがあります。これは Vite だと動作しないため、代わりに [`src/lib`](/docs/modules#$lib) を使用します。

### ページとレイアウト

#### 名前が変わったファイル

カスタムエラーページコンポーネントを `_error.svelte` から `__error.svelte` にリネームしてください。同様に、`_layout.svelte` ファイルも `__layout.svelte` にリネームしてください。SvelteKit では二重のアンダースコアの接頭辞をリザーブしています。[プライベートモジュール](/docs/routing#private-modules)にはまだ接頭辞として `_` を 1 つ付けます([`ルート(routes)`](/docs/configuration#routes)コンフィグで変更可能です)。

#### Imports

`@sapper/app` からインポートしていた `goto`、`prefetch`、`prefetchRoutes` は [`$app/navigation`](/docs/modules#$app-navigation) からのインポートに置き換えてください。

`@sapper/app` からインポートしていた `stores` については置き換える必要があります — 以下の [Stores](/docs/migrating#pages-and-layouts-stores)) をご覧ください。

`src/node_modules` にあるディレクトリからインポートしてたファイルは、[`$lib`](/docs/modules#$lib) からのインポートに置き換えてください。

#### Preload

以前と同様に、ページやレイアウトではレンダリングが行われる前にデータをロードできる関数をエクスポートすることができます。

この関数は `preload` から [`load`](/docs/loading) にリネームされ、その API が変更されました。2 つの引数 — `page` と `session` — の代わりに、両方を 1 つにまとめた引数と、`fetch` (`this.fetch` からの置き換え)、そして新たに `stuff` オブジェクトが追加されました。

`this` オブジェクトはなくなり、その結果 `this.fetch`、`this.error`、`this.redirect` もなくなりました。プロパティ(props)を直接返す代わりに、`load` は `props` やその他様々なものを _含む_ オブジェクトを返すようになりました。

最後に、もしページに `load` メソッドがある場合は、必ず何かを返すようにしてください。そうしないと `Not found` になります。

#### Stores

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

SvelteKit では、それらにアクセスする方法が異なります。`stores` は `getStores` になりましたが、[`$app/stores`](/docs/modules#$app-stores) から直接 `navigating`、`page`、`session` をインポートできるので、ほとんどの場合は必要ありません。

#### ルーティング

ルート(routes) の正規表現はもうサポートされていません。代わりに、[advanced route matching](/docs/routing#advanced-routing-matching) をお使いください。

#### URLs

Sapper では、相対 URL は、現在のページに対してではなく、base URL (`basepath` オプションが使用されていない限り、大抵の場合は `/`) に対して解決されていました。

これによって問題が発生していましたが、SvelteKit ではもうそのようなことはありません。URL は現在のページ(または `load` 関数の `fetch` URL の場合は移動先のページ) に対して解決されるようになりました。

#### &lt;a&gt; attributes

- `sapper:prefetch` は現在 `sveltekit:prefetch` になりました
- `sapper:noscroll` は現在 `sveltekit:noscroll` になりました

### Endpoints

Sapper では、'server routes' (現在は [エンドポイント(endpoints)](/docs/routing#endpoints) と呼ばれる) は、Node の `http` モジュール によって公開される `req` と `res` オブジェクト(または Polka や Express などのフレームワークが提供するその拡張版) を受け取っていました。

SvelteKit は、アプリが動作する場所に依存しないように設計されています(Node サーバーで動作し、サーバーレスプラットフォームや Cloudflare Worker でも同様に動作します)。そのため、もう `req` と `res` を直接扱いません。エンドポイントを、新しいシグネチャに合わせて更新する必要があります。

環境非依存な動作をサポートするため、グローバルコンテキストで `fetch` が利用できるようになり、`node-fetch` や `cross-fetch` などのサーバーサイドの fetch 実装をインポートする必要がなくなりました。

### インテグレーション

インテグレーションに関する詳細情報については [FAQ](/faq#integrations) をご参照ください。

#### HTML minifier

Sapper はデフォルトで `html-minifier` を含んでいました。SvelteKit はこれを含まないのですが、[hook](/docs/hooks#handle) としてこれを追加することができます:

```js
// @filename: ambient.d.ts
/// <reference types="@sveltejs/kit" />
declare module 'html-minifier';

// @filename: index.js
// ---cut---
import { minify } from 'html-minifier';
import { prerendering } from '$app/env';

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
	removeComments: true,
	removeOptionalTags: true,
	removeRedundantAttributes: true,
	removeScriptTypeAttributes: true,
	removeStyleLinkTypeAttributes: true,
	sortAttributes: true,
	sortClassName: true
};

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event);

	if (prerendering && response.headers.get('content-type') === 'text/html') {
		return new Response(minify(await response.text(), minification_options), {
			status: response.status,
			headers: response.headers
		});
	}

	return response;
}
```

サイトのプロダクションビルドをテストするのに `svelte-kit preview` を使用しているとき、`prerendering` が `false` となることにご注意ください。そのため、minify の結果を検証するには、ビルド済の HTML を直接確認する必要があります。
