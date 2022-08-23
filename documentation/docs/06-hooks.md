---
title: Hooks
---

オプションの `src/hooks.js` (または `src/hooks.ts`、または `src/hooks/index.js`) ファイルはサーバー上で実行される3つの関数 — `handle`、`handleError`、`externalFetch` — をエクスポートできます。全てオプションです。

> このファイルの配置場所は [コンフィグ](/docs/configuration) の `config.kit.files.hooks` で変更することができます。

### handle

この関数は SvelteKit のサーバーが [リクエスト](/docs/web-standards#fetch-apis-request) を受けるたびに (アプリの実行中であろうと、[プリレンダリング](/docs/page-options#prerender)であろうと) 実行され、[レスポンス](/docs/web-standards#fetch-apis-response) を決定します。リクエストを表す `event` オブジェクトと、ルート(route)をレンダリングしレスポンスを生成する `resolve` という関数を受け取ります。これにより、レスポンスのヘッダーやボディを変更したり、SvelteKitを完全にバイパスすることができます (例えば、プログラムでルート(routes)を実装する場合など)。

```js
/// file: src/hooks.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (event.url.pathname.startsWith('/custom')) {
		return new Response('custom response');
	}

	const response = await resolve(event);
	return response;
}
```

> 静的アセット(プリレンダリング済みのページを含む)に対するリクエストは SvelteKit では処理されません。

If unimplemented, defaults to `({ event, resolve }) => resolve(event)`. To add custom data to the request, which is passed to handlers in `+server.js` and server-only `load` functions, populate the `event.locals` object, as shown below.

```js
/// file: src/hooks.js
// @filename: ambient.d.ts
type User = {
	name: string;
}

declare namespace App {
	interface Locals {
		user: User;
	}
}

const getUserInformation: (cookie: string | null) => Promise<User>;

// declare global {
// 	const getUserInformation: (cookie: string) => Promise<User>;
// }

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.request.headers.get('cookie'));

	const response = await resolve(event);
	response.headers.set('x-custom-header', 'potato');

	return response;
}
```

[`sequence` ヘルパー関数](/docs/modules#sveltejs-kit-hooks)を使用すると、複数の `handle` 関数呼び出しを追加することができます。

`resolve` はオプションの第2引数をサポートしており、レスポンスのレンダリング方法をより詳細にコントロールすることができます。そのパラメータは、以下のフィールドを持つオブジェクトです:

- `ssr: boolean` (default `true`) — `false` の場合、サーバーサイドレンダリングの代わりに空の 'shell' ページをレンダリングします
- `transformPageChunk(opts: { html: string, done: boolean }): MaybePromise<string | undefined>` — カスタムの変換を HTML に適用します。`done` が true の場合、それが最後のチャンクです。チャンクは整形された HTML であることが保証されませんが (例えば、要素の開始タグは含むが終了タグは含まれない、など)、常に `%sveltekit.head%` や レイアウト(layout)/ページ(page) コンポーネントなどのような理にかなった境界 (sensible boundaries) で分割されます。

```js
/// file: src/hooks.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		ssr: !event.url.pathname.startsWith('/admin'),
		transformPageChunk: ({ html }) => html.replace('old', 'new')
	});

	return response;
}
```

> [サーバーサイドレンダリング](/docs/appendix#ssr) を無効にすると、SvelteKit アプリは事実上 [**シングルページアプリ** または SPA](/docs/appendix#csr-and-spa) になります。ほとんどの場合、これは推奨されません ([appendix を参照](/docs/appendix#ssr))。無効にすることが本当に適切かどうかを検討し、すべてのリクエストに対して無効にするのではなく、選択的に無効にしてください。

### handleError

If an error is thrown during loading or rendering, this function will be called with the `error` and the `event` that caused it. This allows you to send data to an error tracking service, or to customise the formatting before printing the error to the console.

開発中、もし Svelte コードで構文エラーが発生した場合、エラー場所をハイライトする `frame` プロパティが追加されます。

未実装の場合、SvelteKitはデフォルトのフォーマットでエラーをログ出力します。

```js
/// file: src/hooks.js
// @filename: ambient.d.ts
const Sentry: any;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').HandleError} */
export function handleError({ error, event }) {
	// example integration with https://sentry.io/
	Sentry.captureException(error, { event });
}
```

> `handleError` is only called for _unexpected_ errors. It is not called for errors created with the [`error`](/docs/modules#sveltejs-kit-error) function imported from `@sveltejs/kit`, as these are _expected_ errors.

### externalFetch

この関数によって、サーバー上で (またはプリレンダリング中に) 実行される `load` 関数の中で発生する、外部リソースへの `fetch` リクエストを変更 (または置換) することができます。

例えば、ユーザーがクライアントサイドで `https://api.yourapp.com` のようなパブリックなURLに移動をするときには、`load` 関数でそのURLにリクエストを行うかもしれません。しかしSSRでは、(パブリックなインターネットとの間にあるプロキシーやロードバランサーをバイパスして) 直接 API にアクセスするほうが理にかなっている場合があります。

```js
/** @type {import('@sveltejs/kit').ExternalFetch} */
export async function externalFetch(request) {
	if (request.url.startsWith('https://api.yourapp.com/')) {
		// clone the original request, but change the URL
		request = new Request(
			request.url.replace('https://api.yourapp.com/', 'http://localhost:9999/'),
			request
		);
	}

	return fetch(request);
}
```
