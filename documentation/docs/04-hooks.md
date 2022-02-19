---
title: Hooks
---

オプションの `src/hooks.js` (または `src/hooks.ts`、または `src/hooks/index.js`) ファイルはサーバー上で実行される4つの関数 — **handle**、**handleError**、**getSession**、**externalFetch** — をエクスポートできます。それらは全てオプションです。

> このファイルの配置場所は [コンフィグ](/docs/configuration) の `config.kit.files.hooks` で変更することができます。

### handle

この関数は SvelteKit がリクエストを受けるたびに (アプリの実行中であろうと、[プリレンダリング](/docs/page-options#prerender)であろうと) 実行され、レスポンスを決定します。リクエストを表す `event` オブジェクトと、SvelteKitのルーターを呼び出しそれに応じて(ページをレンダリングしたり、エンドポイントを呼び出したりして)レスポンスを生成する `resolve` という関数を受け取ります。これにより、レスポンスのヘッダーやボディを変更したり、SvelteKitを完全にバイパスすることができます (例えば、プログラムでエンドポイントを実装する場合など)。

```js
/// file: src/hooks.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	if (event.request.url.startsWith('/custom')) {
		return new Response('custom response');
	}

	const response = await resolve(event);
	return response;
}
```

> 静的アセット(プリレンダリング済みのページを含む)に対するリクエストは SvelteKit では処理されません。

未実装の場合、デフォルトでは `({ event, resolve }) => resolve(event)` となります。カスタムデータをリクエストに追加してエンドポイントに渡すには、以下のように `event.locals` オブジェクトにデータを追加します。

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
	interface Platform {}
	interface Session {}
	interface Stuff {}
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

- `ssr: boolean` (default `true`) — `false` の場合、サーバーサイドレンダリングする代わりに空の 'shell' ページをレンダリングします
- `transformPage(opts: { html: string }): string` — カスタムの変換を HTML に適用します

```js
/// file: src/hooks.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		ssr: !event.url.pathname.startsWith('/admin'),
		transformPage: ({ html }) => html.replace('old', 'new')
	});

	return response;
}
```

> [サーバーサイドレンダリング](/docs/appendix#ssr) を無効にすると、SvelteKit アプリは事実上 [**シングルページアプリ** または SPA](/docs/appendix#csr-and-spa) になります。ほとんどの場合、これは推奨されません ([appendix を参照](/docs/appendix#ssr))。無効にすることが本当に適切かどうかを検討し、すべてのリクエストに対して無効にするのではなく、選択的に無効にしてください。

### handleError

もしレンダリング中にエラーがスローされたら、`error` とそれを引き起こした `event` を引数にこの関数が呼び出されます。これによってデータをエラートラッキングサービスに送ったり、エラーをコンソールに出力する前にフォーマットをカスタマイズしたりすることができます。

開発中、もし Svelte コードで構文エラーが発生した場合、エラー場所をハイライトする `frame` プロパティが追加されます。

未実装の場合、SvelteKitはデフォルトのフォーマットでエラーをログ出力します。

```js
/// file: src/hooks.js
// @filename: ambient.d.ts
const Sentry: any;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').HandleError} */
export async function handleError({ error, event }) {
	// example integration with https://sentry.io/
	Sentry.captureException(error, { event });
}
```

> `handleError` は例外がキャッチされていない場合にのみ呼び出されます。ページやエンドポイントが明示的に 4xx や 5xx ステータスコードで応答した場合は呼び出されません。

### getSession

この関数は、`event` オブジェクトを引数に取り、[クライアントからアクセス可能](/docs/modules#$app-stores)な `session` オブジェクトを返します。つまり `session` オブジェクトはユーザーに公開しても安全なものでなければなりません。この関数はSvelteKitがページをサーバーレンダリングする際に実行されます。

未実装の場合、session は `{}` です。

```js
/// file: src/hooks.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
			email: string;
			avatar: string;
			token: string;
		}
	}
	interface Session {
		user?: {
			name: string;
			email: string;
			avatar: string;
		}
	}
}

type MaybePromise<T> = T | Promise<T>;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').GetSession} */
export function getSession(event) {
	return event.locals.user
		? {
				user: {
					// only include properties needed client-side —
					// exclude anything else attached to the user
					// like access tokens etc
					name: event.locals.user.name,
					email: event.locals.user.email,
					avatar: event.locals.user.avatar
				}
		  }
		: {};
}
```

> `session` はシリアライズ可能でなければなりません。つまり、関数やカスタムクラスなどを含んではならず、JavaScriptの組み込みデータ型だけでなければいけません

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
