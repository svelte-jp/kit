---
title: Loading data
---

[`+page.svelte`](/docs/routing#page-page-svelte) や [`+layout.svelte`](/docs/routing#layout-layout-svelte) は `load` 関数からその `data` を取得します。

もし `load` 関数が `+page.js` や `+layout.js` に定義されている場合は、サーバーとブラウザのどちらでも実行されます。代わりに `+page.server.js` や `+layout.server.js` に定義されている場合はサーバー上でのみ実行され、例えばデータベースにコールしたりプライベートな [環境変数](/docs/modules#$env-static-private) にアクセスすることができます。ただし、[devalue](https://github.com/rich-harris/devalue) でシリアライズされたデータのみを返すことができます。どちらの場合でも、戻り値は (もしあれば) オブジェクトでなければなりません。

```js
/// file: src/routes/+page.js
/** @type {import('./$types').PageLoad} */
export function load(event) {
	return {
		some: 'data'
	};
}
```

### Inputプロパティ

`load` 関数の引数は `LoadEvent` (または、サーバー専用の `load` 関数の場合は `ServerLoadEvent` で、`RequestEvent` から `clientAddress`、`cookies`、`locals`、`platform`、`request` を継承しています)。全てのイベントは以下のプロパティを持ちます:

#### data

ごくまれに、`+page.js` と `+page.server.js` (または `+layout` と同等のもの) の両方が必要になることがあります。このような場合、`+page.js` はサーバーから `data` を受け取り、その後に `+page.svelte` に `data` を渡します:

```js
/// file: src/routes/my-route/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export function load() {
	return {
		a: 1
	};
}
```

```js
/// file: src/routes/my-route/+page.js
// @filename: $types.d.ts
export type PageLoad = import('@sveltejs/kit').Load<{}, { a: number }>;

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageLoad} */
export function load({ data }) {
	return {
		b: data.a * 2
	};
}
```

```svelte
/// file: src/routes/my-route/+page.svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;

	console.log(data.a); // `undefined`, it wasn't passed through in +page.js
	console.log(data.b); // `2`
</script>
```

言い換えると、`+page.server.js` は `data` を `+page.js` に渡し、`+page.js` は `data` を `+page.svelte` に渡します。

#### params

`params` は `url.pathname` とルート(route)のファイル名から導出されます。

ルート(route)のファイル名が  `src/routes/a/[b]/[...c]` で、`url.pathname` が `/a/x/y/z` という例の場合、`params` オブジェクトは次のようになります:

```json
{
	"b": "x",
	"c": "y/z"
}
```

#### routeId

現在のルート(route)ディレクトリの名前で、`src/routes` からの相対です:

```js
/// file: src/routes/blog/[slug]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ routeId }) {
	console.log(routeId); // 'blog/[slug]'
}
```

#### url

[`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) のインスタンスで、`origin`、`hostname`、`pathname`、`searchParams` ([`URLSearchParams`](https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams) オブジェクトとしてパースされたクエリ文字列を含む) といったプロパティを持っています。`url.hash` は、サーバーでは使用できないため `load` 中にアクセスできません。

> 環境によっては、サーバーサイドレンダリングのときにリクエストヘッダーからこれが導き出される場合もあります。例えば、[adapter-node](/docs/adapters#supported-environments-node-js) を使用している場合、URL を正確にするために adapter に設定が必要かもしれません。

### Inputメソッド

`LoadEvent` は以下のメソッドも持ちます:

#### depends

この関数は `load` 関数が1つ以上の URL またはカスタムの識別子(custom identifiers)に _依存(dependency)_ していることを宣言します。その URL は後で [`invalidate()`](/docs/modules#$app-navigation-invalidate) と一緒に使用することで、`load` を再実行させることができます。

`fetch` が `depends` を呼び出すので、これが必要になることはほとんどありません。これが必要になるのは、`fetch` をバイパスするカスタムの API クライアントを使用している場合のみです。

URL はロードされるページに対し、絶対パスか相対パスにすることできますが、[エンコード](https://developer.mozilla.org/ja/docs/Glossary/percent-encoding) されていなければなりません。

カスタムの識別子(custom identifiers)は、[URI の仕様](https://www.rfc-editor.org/rfc/rfc3986.html) に準拠するために、1つ以上の小文字の後にコロンを付ける必要があります。

```js
// @filename: ambient.d.ts
declare module '$lib/api' {
	interface Data{}
	export const base: string;
	export const client: {
		get: (resource:string) => Promise<Data>
	}
}

// @filename: index.js
// ---cut---
import * as api from '$lib/api';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
	depends(
		`${api.base}/foo`,
		`${api.base}/bar`,
		'my-stuff:foo'
	);

	return {
		foo: api.client.get('/foo'),
		bar: api.client.get('/bar')
	};
}
```

#### fetch

`fetch` は [ネイティブの `fetch` web API](https://developer.mozilla.org/ja/docs/Web/API/fetch) と同等ですが、いくつか追加の機能があります:

- ページリクエストの `cookie` と `authorization` ヘッダーを継承するので、サーバー上でクレデンシャル付きのリクエストを行うことができます
- サーバー上で、相対パスのリクエストを行うことができます (通常、`fetch` はサーバーのコンテキストで使用する場合にはオリジン付きの URL が必要です)
- サーバーで動作している場合、内部リクエスト (例えば `+server.js` ルート(routes)に対するリクエスト) は直接ハンドラ関数を呼び出すので、HTTP を呼び出すオーバーヘッドがありません
- サーバーサイドレンダリング中は、レスポンスはキャプチャされ、レンダリング済の HTML にインライン化されます。ヘッダーは、[`filterSerializedResponseHeaders`](/docs/hooks#handle) で明示的に指定されない限り、シリアライズされないことにご注意ください
- ハイドレーション中は、レスポンスは HTML から読み込まれ、一貫性が保証され、追加のネットワークリクエストを防ぎます

> Cookie は、ターゲットホストが Sveltekit アプリケーションと同じか、より明確・詳細(specific)なサブドメインである場合にのみ引き渡されます。

#### parent

`await parent()` は親レイアウトの `load` 関数からデータを返します。`+page.server.js` または `+layout.server.js` で使用する場合は、親の `+layout.server.js` ファイルの `load` 関数からデータを返します:

```js
/// file: src/routes/+layout.server.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return { a: 1 };
}
```

```js
/// file: src/routes/foo/+layout.server.js
// @filename: $types.d.ts
export type LayoutLoad = import('@sveltejs/kit').Load<{}, null, { a: number }>;

// @filename: index.js
// ---cut---
/** @type {import('./$types').LayoutLoad} */
export async function load({ parent }) {
	const { a } = await parent();
	console.log(a); // `1`

	return { b: 2 };
}
```

```js
/// file: src/routes/foo/+page.server.js
// @filename: $types.d.ts
export type PageLoad = import('@sveltejs/kit').Load<{}, null, { a: number, b: number }>;

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
	const { a, b } = await parent();
	console.log(a, b); // `1`, `2`

	return { c: 3 };
}
```

`+page.js` または `+layout.js` で使用する場合、親の `+layout.js` ファイルの `load` 関数からデータを返します。`+layout.js` が見つからない場合は、暗黙的に `({ data }) => data` 関数として扱われ、親の `+layout.server.js` ファイルからのデータも返されます。

`await parent()` を使用するときは、誤ってウォーターフォールを発生させないようご注意ください。例えば、戻り値のアウトプットに親のデータをマージしたいだけであれば、他のデータを取得した _後_ に `await parent()` を呼び出してください。

```diff
/// file: src/routes/foo/+page.server.js
// @filename: $types.d.ts
export type PageLoad = import('@sveltejs/kit').Load<{}, null, { a: number, b: number }>;

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageLoad} */
export async function load({ parent, fetch }) {
-	const parentData = await parent();
	const data = await fetch('./some-api');
+	const parentData = await parent();

	return {
		...data
		meta: { ...parentData.meta, ...data.meta }
	};
}
```

#### setHeaders

レスポンスにヘッダーを設定する必要がある場合、`setHeaders` メソッドを使用してそれを行うことができます。これは、例えばページをキャッシュさせたい場合に便利です:

```js
// @errors: 2322
/// file: src/routes/blog/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, setHeaders }) {
	const url = `https://cms.example.com/articles.json`;
	const response = await fetch(url);

	setHeaders({
		age: response.headers.get('age'),
		'cache-control': response.headers.get('cache-control')
	});

	return response.json();
}
```

> `load` 関数がブラウザで実行された場合、`setHeaders` には効果がありません。

同じヘッダーを複数回設定すると (`load` 関数が分かれている場合でも) エラーとなります。付与したいヘッダーは一度だけ設定してください。

You cannot add a `set-cookie` header with `setHeaders` — use the [`cookies`](/docs/types#sveltejs-kit-cookies) API in a server-only `load` function instead.

### Output

返される `data` は、それがなんであれ、値のオブジェクトでなければなりません。サーバー専用の `load` 関数の場合、これらの値は [devalue](https://github.com/rich-harris/devalue) でシリアライズできなければなりません。トップレベルの promise は await されるので、ウォーターフォールを作ることなく、複数の promise を簡単に返すことができます:

```js
// @filename: $types.d.ts
export type PageLoad = import('@sveltejs/kit').Load<{}>;

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageLoad} */
export function load() {
	return {
		a: Promise.resolve('a'),
		b: Promise.resolve('b'),
		c: {
			value: Promise.resolve('c')
		}
	};
}
```

```svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;

	console.log(data.a); // 'a'
	console.log(data.b); // 'b'
	console.log(data.c.value); // `Promise {...}`
</script>
```

### エラー(Errors)

`load` 中にエラーがスローされた場合、もっとも近くにある [`+error.svelte`](/docs/routing#error) がレンダリングされます。 _想定される_ エラーについては、`@sveltejs/kit` からインポートできる `error` ヘルパーを使用して、HTTP ステータスコードとオプションのメッセージを指定できます:

```js
/// file: src/routes/admin/+layout.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
			isAdmin: boolean;
		}
	}
}

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
		throw error(401, 'not logged in');
	}

	if (!locals.user.isAdmin) {
		throw error(403, 'not an admin');
	}
}
```

_予期せぬ_ エラーがスローされた場合、SvelteKit は [`handleError`](/docs/hooks#handleerror) を実行し、それを 500 Internal Server Error として扱います。

> 開発中は、予期せぬエラーのスタックトレースを `$page.error.stack` として表示します。本番環境では、スタックトレースは非表示となります。

### リダイレクト(Redirects)

ユーザーをリダイレクトするには、`@sveltejs/kit` からインポートできる `redirect` ヘルパーを使用して、ステータスコード `3xx` と一緒にリダイレクト先の location を指定します。

```diff
/// file: src/routes/admin/+layout.server.js
-import { error } from '@sveltejs/kit';
+import { error, redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
-		throw error(401, 'not logged in');
+		throw redirect(307, '/login');
	}

	if (!locals.user.isAdmin) {
		throw error(403, 'not an admin');
	}
}
```

### Invalidation

SvelteKit は、ナビゲーション中に `load` 関数の不必要な再実行を避けるために、各 `load` 関数の依存関係(dependencies)を追跡します。例えば、あるページから別のページにナビゲーションするとき、最上位の `+layout.js` の `load` 関数が参照する `url` や `params` のメンバーが直前のナビゲーションから変わっていなければ、再実行する必要はありません。

`load` 関数は以下の状況で再実行されます:

- 参照している `params` プロパティの値が変更された場合
- 参照している `url` プロパティ (`url.pathname` や `url.search`) の値が変更された場合
- `await parent()` を呼び出していて、親の `load` 関数が再実行された場合
- [`fetch`](#fetch) や [`depends`](#depends) を介して特定の URL に対する依存を宣言していて、その URL が [`invalidate(url)`](/docs/modules#$app-navigation-invalidate) で無効 (invalid) であるとマークされた場合
- [`invalidate()`](/docs/modules#$app-navigation-invalidate) によって全ての有効な `load` 関数が強制的に再実行された場合

`load` 関数の再実行がトリガーされた場合、ページは再マウントされません。その代わり、新しい `data` で更新されます。つまり、コンポーネントの内部状態は保持されるということです。これがお望みでなければ、[`afterNavigate`](/docs/modules#$app-navigation-afternavigate) コールバックの中でリセットすることができますし、コンポーネントを [`{#key ...}`](https://svelte.jp/docs#template-syntax-key) ブロックでくくることもできます。

### 状態の共有(Shared state)

多くのサーバー環境では、アプリの単一インスタンスが複数のユーザーをサーブします。そのため、リクエストごとの状態(per-request state)は `load` 関数の外側の共有変数に保存してはいけません。代わりに、`event.locals` に保存してください。同様に、ユーザーごとの状態(per-user state)をグローバル変数に保存してはいけません。代わりに `$page.data` (全ての `load` 関数のデータを結合したもの) を使用するか、または Svelte の [context 機能](https://svelte.jp/docs#run-time-svelte-setcontext) を使用してスコープ付きの状態(scoped state)を作成してください。
