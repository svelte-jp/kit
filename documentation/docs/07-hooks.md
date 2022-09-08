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

- `transformPageChunk(opts: { html: string, done: boolean }): MaybePromise<string | undefined>` — カスタムの変換を HTML に適用します。`done` が true である場合、それは最後のチャンクです。チャンクが整形された HTML であることは保証されませんが (例えば、要素の開始タグは含むが終了タグは含まれない、など)、常に `%sveltekit.head%` やレイアウト(layout)/ページ(page)コンポーネントなどのような理にかなった境界 (sensible boundaries) で分割されます。
- `filterSerializedResponseHeaders(name: string, value: string): boolean` — `load` 関数が `fetch` でリソースを読み込むときに、シリアライズされるレスポンスにどのヘッダーを含めるかを決定します。デフォルトでは何も含まれません。

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

この関数は、サーバー上で(またはプリレンダリング中に)実行される `load` 関数の中で発生する `fetch` リクエストを変更(または置換)します。

例えば、アプリの前に置かれるプロキシによって追加されるカスタムのヘッダーを含める必要がある場合は:

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

または、ユーザーがクライアントサイドでそれぞれのページに移動する際に、`load` 関数で `https://api.yourapp.com` のようなパブリックな URL にリクエストを行うかもしれませんが、SSR の場合には (パブリックなインターネットとの間にあるプロキシやロードバランサーをバイパスして) API を直接呼ぶほうが理にかなっているでしょう。

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

同一オリジン(same-origin)リクエストの場合、SvelteKit の `fetch` 実装は、`credentials` オプションを `"omit"` にしない限り、 `cookie` と `authorization` ヘッダーを転送します。

クロスオリジン(cross-origin)リクエストの場合、リクエスト URL がアプリのサブドメインに属するときは `cookie` はリクエストに含まれます。例えば、あなたのアプリが `my-domain.com` にあり、あなたの API が `api.my-domain.com` にある場合、cookie はリクエストに含まれることになります。

もしあなたのアプリと API が兄弟関係にあるサブドメイン (例えば `www.my-domain.com` と `api.my-domain.com`) の場合は、`my-domain.com` のような共通の親ドメインに属する cookie は含まれません、なぜなら SvelteKit にはその cookie がどのドメインに属するか判断する方法がないからです。こういったケースでは、`handleFetch` を使って手動で cookie を含める必要があります:

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
