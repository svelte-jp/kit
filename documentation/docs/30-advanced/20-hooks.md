---
title: Hooks
---

'Hooks' は、特定のイベントに対して SvelteKit がレスポンスを呼び出すことを宣言するアプリ全体の関数で、これによってフレームワークの動作をきめ細やかに制御できるようになります。

hooks ファイルは2つあり、どちらもオプションです:

- `src/hooks.server.js` — アプリのサーバーの hooks
- `src/hooks.client.js` — アプリのクライアントの hooks

これらのモジュールのコードはアプリケーションの起動時に実行されるので、データベースクライアントの初期化などに有用です。

> これらのファイルの場所は [`config.kit.files.hooks`](configuration#files) で設定できます。

## Server hooks

以下の hooks は `src/hooks.server.js` に追加することができます:

### handle

この関数は SvelteKit のサーバーが [リクエスト](web-standards#fetch-apis-request) を受けるたびに (アプリの実行中であろうと、[プリレンダリング](page-options#prerender)であろうと) 実行され、[レスポンス](web-standards#fetch-apis-response) を決定します。リクエストを表す `event` オブジェクトと、ルート(route)をレンダリングしレスポンスを生成する `resolve` という関数を受け取ります。これにより、レスポンスのヘッダーやボディを変更したり、SvelteKitを完全にバイパスすることができます (例えば、プログラムでルート(routes)を実装する場合など)。

```js
/// file: src/hooks.server.js
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

未実装の場合、デフォルトは `({ event, resolve }) => resolve(event)` となります。カスタムデータをリクエストに追加し、`+server.js` のハンドラーやサーバー(server) `load` 関数に渡すには、以下のように `event.locals` オブジェクトに埋め込んでください。

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
type User = {
	name: string;
}

declare namespace App {
	interface Locals {
		user: User;
	}
}

const getUserInformation: (cookie: string | void) => Promise<User>;

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

[`sequence` ヘルパー関数](modules#sveltejs-kit-hooks)を使用すると、複数の `handle` 関数を定義することができます。

`resolve` はオプションの第2引数をサポートしており、レスポンスのレンダリング方法をより詳細にコントロールすることができます。そのパラメータは、以下のフィールドを持つオブジェクトです:

- `transformPageChunk(opts: { html: string, done: boolean }): MaybePromise<string | undefined>` — カスタムの変換を HTML に適用します。`done` が true である場合、それは最後のチャンクです。チャンクが整形された HTML であることは保証されませんが (例えば、要素の開始タグは含むが終了タグは含まれない、など)、常に `%sveltekit.head%` やレイアウト(layout)/ページ(page)コンポーネントなどのような理にかなった境界 (sensible boundaries) で分割されます。
- `filterSerializedResponseHeaders(name: string, value: string): boolean` — `load` 関数が `fetch` でリソースを読み込むときに、シリアライズされるレスポンスにどのヘッダーを含めるかを決定します。デフォルトでは何も含まれません。
- `preload(input: { type: 'js' | 'css' | 'font' | 'asset', path: string }): boolean` — `<head>` タグにどのファイルをプリロードの対象として追加するか決定します。このメソッドはビルド時、コードチャンクを構築している際に見つかったファイルごとに呼び出されます。これにより、例えば `+page.svelte` に `import './styles.css` がある場合、そのページに訪れたときにその CSS ファイルへの解決されたパスを以て `preload` が呼び出されるようになります。これはビルド時の分析によって行われるため、開発モードでは `preload` が呼ばれないことにご注意ください。プリロードによってその対象がより早くダウンロードされるようになるためパフォーマンスが改善しますが、不必要に多くのものをダウンロードしてしまうと、core web vitals を悪化させてしまいます。デフォルトでは、`js`、`css` ファイルがプリロードされます。現時点では `asset` ファイルはプリロードされませんが、フィードバックによっては追加されるかもしれません。

```js
/// file: src/hooks.server.js
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('old', 'new'),
		filterSerializedResponseHeaders: (name) => name.startsWith('x-'),
		preload: ({ type, path }) => type === 'js' || path.includes('/important/')
	});

	return response;
}
```

`resolve(...)` は決してエラーをスローせず、適切なステータスコードと `Promise<Response>` を返すことにご注意ください。もし `handle` 中に他の場所でエラーがスローされた場合、それは致命的(fatal)なものとして扱われ、SvelteKit は `Accept` ヘッダーに応じて、そのエラーの JSON 表現か、`src/error.html` でカスタマイズ可能なフォールバックエラーページをレスポンスとして返します。エラーハンドリングの詳細は [こちら](errors) からお読み頂けます。

### handleFetch

この関数は、サーバー上で (またはプリレンダリング中に) 実行される `load` 関数や `action` 関数の中で発生する `fetch` リクエストを変更 (または置換) することできます。

例えば、ユーザーがクライアントサイドでそれぞれのページに移動する際に、`load` 関数で `https://api.yourapp.com` のようなパブリックな URL にリクエストを行うかもしれませんが、SSR の場合には (パブリックなインターネットとの間にあるプロキシやロードバランサーをバイパスして) API を直接呼ぶほうが理にかなっているでしょう。

```js
/// file: src/hooks.server.js
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

**Credentials**

同一オリジン(same-origin)リクエストの場合、SvelteKit の `fetch` 実装は、`credentials` オプションを `"omit"` にしない限り、 `cookie` と `authorization` ヘッダーを転送します。

クロスオリジン(cross-origin)リクエストの場合、リクエスト URL がアプリのサブドメインに属するときは `cookie` はリクエストに含まれます。例えば、あなたのアプリが `my-domain.com` にあり、あなたの API が `api.my-domain.com` にある場合、cookie はリクエストに含まれることになります。

もしあなたのアプリと API が兄弟関係にあるサブドメイン (例えば `www.my-domain.com` と `api.my-domain.com`) の場合は、`my-domain.com` のような共通の親ドメインに属する cookie は含まれません、なぜなら SvelteKit にはその cookie がどのドメインに属するか判断する方法がないからです。こういったケースでは、`handleFetch` を使って手動で cookie を含める必要があります:

```js
/// file: src/hooks.server.js
// @errors: 2345
/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	if (request.url.startsWith('https://api.my-domain.com/')) {
		request.headers.set('cookie', event.request.headers.get('cookie'));
	}

	return fetch(request);
}
```

## Shared hooks

以下は `src/hooks.server.js` _と_ `src/hooks.client.js` のどちらにも追加できます:

### handleError

予期せぬエラーがロード中またはレンダリング中にスローされると、この関数が `error` と `event` を引数にとって呼び出されます。これによって2つのことが可能になります:

- エラーをログに残すことができます
- エラーからメッセージやスタックトレースなどの機密情報を省略し、ユーザーに見せても安全なカスタムの表現を生成することができます。戻り値は `$page.error` の値となります。デフォルトでは、404 (`event.route.id` が `null` になっていることで検知できます) の場合は `{ message: 'Not Found' }`、それ以外の場合は `{ message: 'Internal Error' }` となります。これを型安全にするために、`App.Error` インターフェイスを宣言して、期待される形をカスタマイズすることができます (わかりやすいフォールバックの動作を保証するため、`message: string` を含めなければなりません)。

以下のコードは、エラーの形を `{ message: string; errorId: string }` として型付けし、それを `handleError` 関数から適宜返す例を示しています:

```ts
/// file: src/app.d.ts
declare global {
	namespace App {
		interface Error {
			message: string;
			errorId: string;
		}
	}
}

export {};
```

```js
/// file: src/hooks.server.js
// @errors: 2322
// @filename: ambient.d.ts
declare module '@sentry/node' {
	export const init: (opts: any) => void;
	export const captureException: (error: any, opts: any) => void;
}

// @filename: index.js
// ---cut---
import * as Sentry from '@sentry/node';
import crypto from 'crypto';

Sentry.init({/*...*/})

/** @type {import('@sveltejs/kit').HandleServerError} */
export async function handleError({ error, event }) {
	const errorId = crypto.randomUUID();
	// example integration with https://sentry.io/
	Sentry.captureException(error, { extra: { event, errorId } });

	return {
		message: 'Whoops!',
		errorId
	};
}
```

```js
/// file: src/hooks.client.js
// @errors: 2322
// @filename: ambient.d.ts
declare module '@sentry/svelte' {
	export const init: (opts: any) => void;
	export const captureException: (error: any, opts: any) => void;
}

// @filename: index.js
// ---cut---
import * as Sentry from '@sentry/svelte';

Sentry.init({/*...*/})

/** @type {import('@sveltejs/kit').HandleClientError} */
export async function handleError({ error, event }) {
	const errorId = crypto.randomUUID();
	// example integration with https://sentry.io/
	Sentry.captureException(error, { extra: { event, errorId } });

	return {
		message: 'Whoops!',
		errorId
	};
}
```

> `src/hooks.client.js` では、`handleError` の型は `HandleServerError` ではなく `HandleClientError` で、`event` は `RequestEvent` ではなく `NavigationEvent` です。 

この関数は _想定される_ エラー (`@sveltejs/kit` からインポートされる [`error`](modules#sveltejs-kit-error) 関数でスローされるエラー) の場合は呼び出されません。

開発中、Svelte のコードの構文エラーでエラーが発生した場合、渡される error には、エラーの場所のハイライトが付与された `frame` プロパティがあります。

> `handleError` 自体が決してエラーをスローしないようにしてください。

## その他の参考資料

- [Tutorial: Hooks](https://learn.svelte.jp/tutorial/handle)
