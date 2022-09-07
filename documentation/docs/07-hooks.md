---
title: Hooks
---

オプションの `src/hooks.js` (または `src/hooks.ts`、または `src/hooks/index.js`) ファイルはサーバー上で実行される3つの関数 — `handle`、`handleError`、`handleFetch` — をエクスポートできます。全てオプションです。

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

未実装の場合、デフォルトは `({ event, resolve }) => resolve(event)` となります。カスタムデータをリクエストに追加し、`+server.js` のハンドラーやサーバー専用の `load` 関数に渡すには、以下のように `event.locals` オブジェクトに埋め込んでください。

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

const getUserInformation: (cookie: string | undefined) => Promise<User>;

// declare global {
// 	const getUserInformation: (cookie: string) => Promise<User>;
// }

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.cookies.get('sessionid'));

	const response = await resolve(event);
	response.headers.set('x-custom-header', 'potato');

	return response;
}
```

[`sequence` ヘルパー関数](/docs/modules#sveltejs-kit-hooks)を使用すると、複数の `handle` 関数呼び出しを追加することができます。

`resolve` はオプションの第2引数をサポートしており、レスポンスのレンダリング方法をより詳細にコントロールすることができます。そのパラメータは、以下のフィールドを持つオブジェクトです:

- `transformPageChunk(opts: { html: string, done: boolean }): MaybePromise<string | undefined>` — applies custom transforms to HTML. If `done` is true, it's the final chunk. Chunks are not guaranteed to be well-formed HTML (they could include an element's opening tag but not its closing tag, for example) but they will always be split at sensible boundaries such as `%sveltekit.head%` or layout/page components.
- `filterSerializedResponseHeaders(name: string, value: string): boolean` — determines which headers should be included in serialized responses when a `load` function loads a resource with `fetch`. By default, none will be included.

```js
/// file: src/hooks.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('old', 'new'),
		filterSerializedResponseHeaders: (name) => name.startsWith('x-')
	});

	return response;
}
```

### handleError

ロード中またはレンダリング中にエラーがスローされた場合、この関数は `error` とそれを引き起こした `event` を渡されて呼び出されます。これにより、エラートラッキングサービスにデータを送ったり、エラーをコンソールにプリントする前にフォーマットをカスタマイズすることができます。

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

> `handleError` は _予期せぬ_ エラー の場合にのみ呼び出されます。`@sveltejs/kit` からインポートされる [`error`](/docs/modules#sveltejs-kit-error) 関数で作成されたエラーは _想定される_ エラーであるため、これは呼び出されません。

### handleFetch

This function allows you to modify (or replace) a `fetch` request that happens inside a `load` function that runs on the server (or during pre-rendering).

For example, you might need to include custom headers that are added by a proxy that sits in front of your app:

```js
// @errors: 2345
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	const name = 'x-geolocation-city';
	const value = event.request.headers.get(name);
	request.headers.set(name, value);

	return fetch(request);
}
```

Or your `load` function might make a request to a public URL like `https://api.yourapp.com` when the user performs a client-side navigation to the respective page, but during SSR it might make sense to hit the API directly (bypassing whatever proxies and load balancers sit between it and the public internet).

```js
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ request, fetch }) {
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

#### Credentials

For same-origin requests, SvelteKit's `fetch` implementation will forward `cookie` and `authorization` headers unless the `credentials` option is set to `"omit"`.

For cross-origin requests, `cookie` will be included if the request URL belongs to a subdomain of the app — for example if your app is on `my-domain.com`, and your API is on `api.my-domain.com`, cookies will be included in the request.

If your app and your API are on sibling subdomains — `www.my-domain.com` and `api.my-domain.com` for example — then a cookie belonging to a common parent domain like `my-domain.com` will _not_ be included, because SvelteKit has no way to know which domain the cookie belongs to. In these cases you will need to manually include the cookie using `handleFetch`:

```js
// @errors: 2345
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	if (request.url.startsWith('https://api.my-domain.com/')) {
		request.headers.set('cookie', event.request.headers.get('cookie'));
	}

	return fetch(request);
}
```
