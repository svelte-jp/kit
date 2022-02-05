---
title: Hooks
---

オプションの `src/hooks.js` (または `src/hooks.ts`、または `src/hooks/index.js`) ファイルはサーバー上で実行される4つの関数 — **handle**、**handleError**、**getSession**、**externalFetch** — をエクスポートできます。それらは全てオプションです。

> このファイルの配置場所は [コンフィグ](#configuration) の `config.kit.files.hooks` で変更することができます。

### handle

この関数は SvelteKit がリクエストを受けるたびに (アプリの実行中であろうと、[プリレンダリング](#ssr-and-javascript-prerender)であろうと) 実行され、レスポンスを決定します。リクエストを表す `event` オブジェクトと、SvelteKitのルーターを呼び出しそれに応じて(ページをレンダリングしたり、エンドポイントを呼び出したりして)レスポンスを生成する `resolve` という関数を受け取ります。これにより、レスポンスのヘッダーやボディを変更したり、SvelteKitを完全にバイパスすることができます (例えば、プログラムでエンドポイントを実装する場合など)。

> (プリレンダリング済みのページを含む) 静的アセットに対するリクエストは SvelteKit では処理されません。

未実装の場合、デフォルトでは `({ event, resolve }) => resolve(event)` となります。

```ts
// Declaration types for Hooks
// * declarations that are not exported are for internal use

// type of string[] is only for set-cookie
// everything else must be a type of string
type ResponseHeaders = Record<string, string | string[]>;

export interface RequestEvent<Locals = Record<string, any>, Platform = Record<string, any>> {
	request: Request;
	url: URL;
	params: Record<string, string>;
	locals: Locals;
	platform: Platform;
}

export interface ResolveOpts {
	ssr?: boolean;
}

export interface Handle<Locals = Record<string, any>, Platform = Record<string, any>> {
	(input: {
		event: RequestEvent<Locals, Platform>;
		resolve(event: RequestEvent<Locals, Platform>, opts?: ResolveOpts): MaybePromise<Response>;
	}): MaybePromise<Response>;
}
```

エンドポイントに渡されるリクエストにカスタムデータを追加するには、以下のように `event.locals` オブジェクトにデータを投入します。

```js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUserInformation(event.request.headers.get('cookie'));

	const response = await resolve(event);
	response.headers.set('x-custom-header', 'potato');

	return response;
}
```

[`sequence` ヘルパー関数](#modules-sveltejs-kit-hooks)を使用すると、複数の `handle` 関数呼び出しを追加することができます。

`resolve` はオプションの第2引数をサポートしており、レスポンスのレンダリング方法をより詳細にコントロールすることができます。そのパラメーターは、以下のフィールドを持つオブジェクトです:

- `ssr` — サーバーでページをロードしてレンダリングするかどうかを指定します。

```js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		ssr: !event.url.pathname.startsWith('/admin')
	});

	return response;
}
```

> [サーバーサイドレンダリング](#appendix-ssr) を無効にすると、SvelteKit アプリは事実上 [**シングルページアプリ** または SPA](#appendix-csr-and-spa) になります。ほとんどの場合、これは推奨されません ([appendix を参照](#appendix-ssr))。無効にすることが本当に適切化どうかを検討し、すべてのリクエストに対して無効にするのではなく、選択的に無効にしてください。

### handleError

もしレンダリング中にエラーがスローされたら、`error` とそれを引き起こした `request` を引数にこの関数が呼び出されます。これによってデータをエラートラッキングサービスに送ったり、エラーをコンソールに出力する前にフォーマットをカスタマイズしたりすることができます。

開発中、もし Svelte コードで構文エラーが発生した場合、エラー場所をハイライトする `frame` プロパティが追加されます。

未実装の場合、SvelteKitはデフォルトのフォーマットでエラーをログ出力します。

```ts
// Declaration types for handleError hook
export interface HandleError<Locals = Record<string, any>, Platform = Record<string, any>> {
	(input: { error: Error & { frame?: string }; event: RequestEvent<Locals, Platform> }): void;
}
```

```js
/** @type {import('@sveltejs/kit').HandleError} */
export async function handleError({ error, event }) {
	// example integration with https://sentry.io/
	Sentry.captureException(error, { event });
}
```

> `handleError` は例外がキャッチされていない場合にのみ呼び出されます。ページやエンドポイントが明示的に 4xx や 5xx ステータスコードで応答した場合は呼び出されません。

### getSession

この関数は、`event` オブジェクトを引数に取り、[クライアントからアクセス可能](#modules-$app-stores)な `session` オブジェクトを返します。つまり `session` オブジェクトはユーザーに公開しても安全でなければなりません。この関数はSvelteKitがページをサーバーレンダリングする際に実行されます。

未実装の場合、session は `{}` です。

```ts
// Declaration types for getSession hook
export interface GetSession<
	Locals = Record<string, any>,
	Platform = Record<string, any>,
	Session = any
> {
	(event: RequestEvent<Locals, Platform>): MaybePromise<Session>;
}
```

```js
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

```ts
// Declaration types for externalFetch hook

export interface ExternalFetch {
	(req: Request): Promise<Response>;
}
```

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
