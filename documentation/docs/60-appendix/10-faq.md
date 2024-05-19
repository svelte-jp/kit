---
title: Frequently asked questions
---

## Other resources

[Svelte FAQ](https://svelte.jp/faq) と [`vite-plugin-svelte` FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md) も、これらのライブラリに起因する疑問点には役立ちますのでご参照ください。

## What can I make with SvelteKit?

SvelteKit can be used to create most kinds of applications. Out of the box, SvelteKit supports many features including:

- Dynamic page content with [load](/docs/load) functions and [API routes](/docs/routing#server).
- SEO-friendly dynamic content with [server-side rendering (SSR)](/docs/glossary#ssr).
- User-friendly progressively-enhanced interactive pages with SSR and [Form Actions](/docs/form-actions).
- Static pages with [prerendering](/docs/page-options#prerender).

SvelteKit can also be deployed to a wide spectrum of hosted architectures via [adapters](/docs/adapters). In cases where SSR is used (or server-side logic is added without prerendering), those functions will be adapted to the target backend. Some examples include:

- Self-hosted dynamic web applications with a [Node.js backend](/docs/adapter-node).
- Serverless web applications with backend loaders and APIs deployed as remote functions. See [zero-config deployments](/docs/adapter-auto) for popular deployment options.
- [Static pre-rendered sites](/docs/adapter-static) such as a blog or multi-page site hosted on a CDN or static host. Statically-generated sites are shipped without a backend.
- [Single-page Applications (SPAs)](/docs/single-page-apps) with client-side routing and rendering for API-driven dynamic content. SPAs are shipped without a backend and are not server-rendered. This option is commonly chosen when bundling SvelteKit with an app written in PHP, .Net, Java, C, Golang, Rust, etc.
- A mix of the above; some routes can be static, and some routes can use backend functions to fetch dynamic information. This can be configured with [page options](/docs/page-options) that includes the option to opt out of SSR.

In order to support SSR, a JS backend — such as Node.js or Deno-based server, serverless function, or edge function — is required.

It is also possible to write custom adapters or leverage community adapters to deploy SvelteKit to more platforms such as specialized server environments, browser extensions, or native applications. See [integrations](./integrations) for more examples and integrations.

## SvelteKit で HMR を使うにはどうすればよいですか？ <!--how-do-i-use-hmr-with-sveltekit-->

SvelteKit は [svelte-hmr](https://github.com/sveltejs/svelte-hmr) によってデフォルトで HMR が有効になっています。[Rich の 2020 Svelte Summit のプレゼンテーション](https://svelte.jp/blog/whats-the-deal-with-sveltekit) を見たことがあるなら、より強力そうに見えるバージョンの HMR をご覧になったかもしれません。あのデモでは `svelte-hmr` の `preserveLocalState` フラグがオンになっていました。このフラグは想定外の動作やエッジケースにつながる可能性があるため、現在はデフォルトでオフになっています。でもご心配なく、SvelteKit で HMR を利用することはできます！もしローカルの状態を保持したい場合は、[svelte-hmr](https://github.com/sveltejs/svelte-hmr) ページに説明があるように、`@hmr:keep` または `@hmr:keep-all` ディレクティブを使用することができます。

## package.json の詳細をアプリケーションに含めるにはどうすればよいですか？ <!--how-do-i-include-details-from-package-json-in-my-application-->

SvelteKit では [`svelte.config.js`](./configuration) が ES module であることを想定しているため、JSON ファイルを直接要求することはできません。アプリケーションに、アプリケーションのバージョン番号やその他の情報を `package.json` から読み込みたい場合は、このように JSON を読み込むことができます:

```js
/// file: svelte.config.js
// @filename: index.js
/// <reference types="@types/node" />
import { URL } from 'node:url';
// ---cut---
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = fileURLToPath(new URL('package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(path, 'utf8'));
```

## パッケージをインクルードしようとするとエラーが発生するのですが、どうすれば直せますか？ <!--how-do-i-fix-the-error-i-m-getting-trying-to-include-a-package-->

ライブラリのインクルードに関する問題は、ほとんどが不適切なパッケージングによるものです。ライブラリのパッケージングが Node.js に対応しているかどうかは、[publint の web サイト](https://publint.dev/) でチェックできます。

以下は、ライブラリが正しくパッケージングされているかどうかをチェックする際に気を付けるべき点です:

- `exports` は `main` や `module` などの他のエントリーポイントのフィールドよりも優先されます。`exports` フィールドを追加すると、deep import を妨げることになるため、後方互換性が失われる場合があります。
- `"type": "module"` が指定されていない限り、ESM ファイルは `.mjs` で終わる必要があり、CommonJS ファイルは `.cjs` で終わる必要があります。
-  `exports` が定義されていない場合、`main` を定義する必要があり、それは CommonJS ファイル か ESM ファイル でなければならず、前項に従わなければなりません。`module` フィールドが定義されている場合、ESM ファイルを参照している必要があります。
- Svelte コンポーネントは、コンパイルされていない `.svelte` ファイルとして配布し、パッケージに含まれる JS は ESM のみとして記述していなければなりません。TypeScript などのカスタムスクリプトや SCSS などのスタイル言語は、それぞれ vanilla JS と CSS にするために前処理(preprocess)をしなければなりません。Svelte ライブラリのパッケージングには、[`svelte-package`](./packaging) を使用することを推奨しています。このパッケージによって、これらの作業が行われます。

ライブラリが ESM バージョンを配布している場合、特に Svelte コンポーネントライブラリがその依存関係に含まれている場合、Vite を使用するとブラウザ上で最適に動作します。ライブラリの作者に ESM バージョンを提供するよう提案すると良いでしょう。しかし、CommonJS (CJS) の依存関係も上手く扱えるようにするため、デフォルトで、[`vite-plugin-svelte` が Vite にそれらを事前バンドルするよう指示します](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies)。Vite は `esbuild` を使ってそれらを ESM に変換します。

それでもまだ問題が解消されない場合は、[Vite の issue tracker](https://github.com/vitejs/vite/issues) と 該当のライブラリの issue tracker を検索することを推奨します。[`optimizeDeps`](https://vitejs.dev/config/#dep-optimization-options) や [`ssr`](https://vitejs.dev/config/#ssr-options) の設定値をいじることで問題を回避できる場合もありますが、これはあくまで一時的な回避策とし、問題のあるライブラリの修正を優先したほうが良いでしょう。

## SvelteKit で view transitions API を使うにはどうすればよいですか？ <!--how-do-i-use-the-view-transitions-api-with-sveltekit-->

SvelteKit では [view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/) 向けの特別なインテグレーションはありませんが、[`onNavigate`](/docs/modules#$app-navigation-onnavigate) の中で `document.startViewTransition` を呼び出すことにより、クライアントサイドナビゲーション毎に view transition をトリガーすることができます。

```js
// @errors: 2339 2810
import { onNavigate } from '$app/navigation';

onNavigate((navigation) => {
	if (!document.startViewTransition) return;

	return new Promise((resolve) => {
		document.startViewTransition(async () => {
			resolve();
			await navigation.complete;
		});
	});
});
```

もっと詳しく知りたければ、Svelte ブログの ["Unlocking view transitions"](https://svelte.jp/blog/view-transitions) をご参照ください。

## SvelteKit で X を使うにはどうすればよいですか？ <!--how-do-i-use-x-with-sveltekit-->

[ドキュメントのインテグレーションのセクション](./integrations) をしっかり読み込んでください。それでも問題が解決しない場合のために、よくある問題の解決策を以下に示します。

### データベースのセットアップはどう行えばよいですか？ <!--how-do-i-setup-a-database-->

データベースにクエリするコードを [サーバールート(server route)](./routing#server) に置いてください。.svelte ファイルの中でデータベースにクエリしないでください。コネクションをすぐにセットアップし、シングルトンとしてアプリ全体からクライアントにアクセスできるように `db.js` のようなものを作ると良いでしょう。`hooks.server.js` で1回セットアップするコードを実行し、データベースヘルパーを必要とするすべてのエンドポイントにインポートできます。

### `document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？ <!--how-do-i-use-a-client-side-only-library-that-depends-on-document-or-window-->

もし `document` や `window` 変数にアクセスする必要があったり、クライアントサイドだけで実行するコードが必要な場合は、`browser` チェックでラップしてください:

```js
/// <reference types="@sveltejs/kit" />
// ---cut---
import { browser } from '$app/environment';

if (browser) {
	// client-only code here
}
```

コンポーネントが最初に DOM にレンダリングされた後にコードを実行したい場合は、`onMount` で実行することもできます:

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';

onMount(async () => {
	const { method } = await import('some-browser-only-library');
	method('hello world');
});
```

使用したいライブラリに副作用がなければ静的にインポートすることができますし、サーバー側のビルドでツリーシェイクされ、`onMount` が自動的に no-op に置き換えられます:

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library';

onMount(() => {
	method('hello world');
});
```

最後に、`{#await}` ブロックのご使用も検討してみてください:
```svelte
<!--- file: index.svelte --->
<script>
	import { browser } from '$app/environment';

	const ComponentConstructor = browser ?
		import('some-browser-only-library').then((module) => module.Component) :
		new Promise(() => {});
</script>

{#await ComponentConstructor}
	<p>Loading...</p>
{:then component}
	<svelte:component this={component} />
{:catch error}
	<p>Something went wrong: {error.message}</p>
{/await}
```

### 別のバックエンド API サーバーを使用するにはどうすれば良いですか？ <!--how-do-i-use-a-different-backend-api-server-->

外部の API サーバーにデータをリクエストするのに [`event.fetch`](./load#making-fetch-requests) を使用することができますが、[CORS](https://developer.mozilla.org/ja/docs/Web/HTTP/CORS) に対応しなければならず、一般的にはリクエストのプリフライトが必要になり、結果として高レイテンシーになるなど、複雑になることにご注意ください。別のサブドメインへのリクエストも、追加の DNS ルックアップや TLS セットアップなどのためにレイテンシーが増加する可能性があります。この方法を使いたい場合は、[`handleFetch`](./hooks#server-hooks-handlefetch) が参考になるかもしれません。

別の方法は、頭痛の種である CORS をバイパスするためのプロキシーをセットアップすることです。本番環境では、`/api` などのパスを API サーバーに書き換えます(rewrite)。ローカルの開発環境では、Vite の [`server.proxy`](https://vitejs.dev/config/server-options.html#server-proxy) オプションを使用します。

本番環境で書き換え(rewrite)をセットアップする方法は、デプロイ先のプラットフォームに依存します。もし、書き換える方法がなければ、代わりに [API route](./routing#server) を追加します:

```js
/// file: src/routes/api/[...path]/+server.js
/** @type {import('./$types').RequestHandler} */
export function GET({ params, url }) {
	return fetch(`https://my-api-server.com/${params.path + url.search}`);
}
```

(必要に応じて、`POST`/`PATCH` などのリクエストもプロキシし、`request.headers` も転送(forward)する必要があることにご注意ください)

### ミドルウェア(middleware)を使うにはどうすればよいですか？ <!--how-do-i-use-middleware-->

`adapter-node` は、プロダクションモードで使用するためのミドルウェアを自分のサーバで構築します。開発モードでは、Vite プラグインを使用して Vite にミドルウェア(middleware) を追加することができます。例えば:

```js
// @errors: 2322
// @filename: ambient.d.ts
declare module '@sveltejs/kit/vite'; // TODO this feels unnecessary, why can't it 'see' the declarations?

// @filename: index.js
// ---cut---
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').Plugin} */
const myPlugin = {
	name: 'log-request-middleware',
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			console.log(`Got request ${req.url}`);
			next();
		});
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [myPlugin, sveltekit()]
};

export default config;
```

順序を制御する方法など、詳しくは [Vite の `configureServer` のドキュメント](https://vitejs.dev/guide/api-plugin.html#configureserver) をご覧ください。

### Yarn 2 で動作しますか？ <!--does-it-work-with-yarn-2-->

多少は。Plug'n'Play 機能、通称 'pnp' は動きません (Node のモジュール解決アルゴリズムから逸脱しており、SvelteKitが[数多くのライブラリ](https://blog.sindresorhus.com/get-ready-for-esm-aa53530b3f77)とともに使用している[ネイティブの JavaScript モジュールではまだ動作しません](https://github.com/yarnpkg/berry/issues/638))。[`.yarnrc.yml`](https://yarnpkg.com/configuration/yarnrc#nodeLinker) で `nodeLinker: 'node-modules'` を使用して pnp を無効にできますが、おそらく npm や [pnpm](https://pnpm.io/) を使用するほうが簡単でしょう。同じように高速で効率的ですが、互換性に頭を悩ませることはありません。

### Yarn 3 を使用するにはどうすれば良いですか？ <!--how-do-i-use-with-yarn-3-->

現時点の、最新の Yarn (version 3) の ESM サポート は [experimental](https://github.com/yarnpkg/berry/pull/2161) であるようです。

結果は異なるかもしれませんが、下記が有効なようです。

最初に新しいアプリケーションを作成します:

```sh
yarn create svelte myapp
cd myapp
```

And enable Yarn Berry:

```sh
yarn set version berry
yarn install
```

#### Yarn 3 global cache

Yarn Berry の興味深い機能の1つに、ディスク上のプロジェクトごとに複数のコピーを持つのではなく、パッケージ用に単一のグローバルキャッシュを持つことができる、というのがあります。しかし、`enableGlobalCache` の設定を true にするとビルドが失敗するため、`.yarnrc.yml` ファイルに以下を追加することを推奨します:

```yaml
nodeLinker: node-modules
```

これによってパッケージはローカルの node_modules ディレクトリにダウンロードされますが、上記の問題は回避され、現時点では Yarn の version 3 を使用するベストな方法となります。
