---
title: ルーティング
---

Sveltekitの核心は、 _ファイルシステムベースのルーター_ です。これは、アプリケーション構造がコードベースの構造(具体的には `src/routes` のコンテンツ)によって定義されることを意味します。

> [プロジェクトのコンフィグ](/docs/configuration) を編集することで、これを異なるディレクトリに変更できます。

ルートには、**ページ(pages)** と **エンドポイント(endpoints)** の2つのタイプがあります。

ページは通常、ユーザーに表示するHTML(及びページに必要なCSSやJavaScript)を生成します。デフォルトでは、ページはクライアントとサーバーの両方でレンダリングされますが、この動作は設定によって変更可能です。

エンドポイントは、サーバー上でのみ実行されます(もしくはサイトをビルドするときに[プリレンダリング](/docs/page-options#prerender)している場合)。これは、プライベートな認証情報を必要とするデータベースやAPIにアクセスする場合や、本番環境ネットワーク上のマシンにあるデータを返す場合などに使用されます。ページはエンドポイントにデータをリクエストすることができます。エンドポイントはデフォルトではJSONを返しますが、他のフォーマットでもデータを返すことができます。

### Pages

ページ(Pages)は `.svelte` ファイル (または[`config.extensions`](/docs/configuration) に記載されている拡張子のファイル) に書かれているSvelteコンポーネントです。デフォルトでは、ユーザーが初めてアプリにアクセスすると、サーバーレンダリングバージョンのページと、そのページを'ハイドレート(hydrate)'しクライアントサイドルーターを初期化するJavaScriptが提供されます。それ以降、他のページへのナビゲーションは全てクライアント側で処理され、ページの共通部分を再レンダリングする必要がなくなるため、高速でアプリのような操作感になります。

ファイル名でルート(**route**)が決まります。例えば、`src/routes/index.svelte` はサイトのルート(**root**)になります。

```html
/// file: src/routes/index.svelte
<svelte:head>
	<title>Welcome</title>
</svelte:head>

<h1>Hello and welcome to my site!</h1>
```

`src/routes/about.svelte` と `src/routes/about/index.svelte` はどちらも `/about` ルート(route)になります。

```html
/// file: src/routes/about.svelte
<svelte:head>
	<title>About</title>
</svelte:head>

<h1>About this site</h1>
<p>TODO...</p>
```

動的なパラメータは `[括弧]` を使用してエンコードされます。例えば、ブログ記事は `src/routes/blog/[slug].svelte` のように定義されます。このパラメータは [`load`](/docs/loading#input-params) 関数の中でアクセスできますし、[`page`](/docs/modules#$app-stores) store を使ってアクセスすることもできます。

ファイルやディレクトリは、`[id]-[category].svelte` のように、動的なパーツを複数持つことができます。(パラメータは 'non-greedy' です。`x-y-z` のようにあいまいなケースでは、`id` は `x` 、 `category` は `y-z` となります)

### Endpoints

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルに記述されるモジュールで、HTTP メソッドに対応する [request handler](/docs/types#sveltejs-kit-requesthandler) 関数をエクスポートします。サーバー上でのみ利用可能なデータ(例えば、データベースやファイルシステムにあるデータ) を読み書きできるようにするという役割があります。

```js
/// file: src/routes/items/[id].js
// @filename: ambient.d.ts
type Item = {};

declare module '$lib/database' {
	export const get: (id: string) => Promise<Item>;
}

// @filename: index.js
// ---cut---
import db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
	// `params.id` comes from [id].js
	const item = await db.get(params.id);

	if (item) {
		return {
			body: { item }
		};
	}

	return {
		status: 404
	};
};
```

> エンドポイントを含む全てのサーバーサイドのコードは、外部のAPIにデータをリクエストする場合に備えて、`fetch` にアクセスすることができます。`$lib` のインポートについては心配無用です、それについては[後ほど](/docs/modules#$lib)触れます。

この [request handler](/docs/types#sveltejs-kit-requesthandler) の役割は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。`status` は [HTTPステータスコード](https://httpstatusdogs.com)です。

- `2xx` — 成功レスポンス (デフォルトは `200`)
- `3xx` — リダイレクション (`location` ヘッダーが必要です)
- `4xx` — クライアントエラー
- `5xx` — サーバーエラー

> `{fallthrough: true}` が返された場合、SvelteKit は何か応答する他のルートに [フォールスルー](/docs/routing#advanced-routing-fallthrough-routes) し続けるか、一般的な 404 で応答します。

#### Page endpoints

If an endpoint has the same filename as a page (except for the extension), the page gets its props from the endpoint — via `fetch` during client-side navigation, or via direct function call during SSR.

A page like `src/routes/items/[id].svelte` could get its props from the `body` in the endpoint above:

```svelte
/// file: src/routes/items/[id].svelte
<script>
	// エンドポイント(endpoint)からのデータが入力される
	export let item;
</script>

<h1>{item.title}</h1>
```

Because the page and route have the same URL, you will need to include an `accept: application/json` header to get JSON from the endpoint rather than HTML from the page. You can also get the raw data by appending `/__data.json` to the URL, e.g. `/items/__data.json`.

#### Standalone endpoints

Most commonly, endpoints exist to provide data to the page with which they're paired. They can, however, exist separately from pages. Standalone endpoints have slightly more flexibility over the returned `body` type — in addition to objects, they can return a `Uint8Array`.

Standalone endpoints can be given a file extension if desired, or accessed directly if not:

| filename                      | endpoint   |
| ----------------------------- | ---------- |
| src/routes/data/index.json.js | /data.json |
| src/routes/data.json.js       | /data.json |
| src/routes/data/index.js      | /data      |
| src/routes/data.js            | /data      |

> Support for streaming request and response bodies is [coming soon](https://github.com/sveltejs/kit/issues/3419).

#### POST, PUT, PATCH, DELETE

エンドポイント(Endpoints)は、HTTP メソッドに対応する関数をエクスポートすることで、`GET` だけでなく任意の HTTP メソッドを扱うことができます:

```js
// @noErrors
export function post(event) {...}
export function put(event) {...}
export function patch(event) {...}
export function del(event) {...} // `delete` は予約語 
```

`get` と同様、これらの関数は `body` を返すことができ、それをページにプロパティとして渡されます。`get` からの 4xx/5xx レスポンスはエラーページのレンダリングとなりますが、GET 以外のリクエストに対する同様のレスポンスはそうならないので、フォームのバリデーションエラーのレンダリングのようなことを行うことができます:

```js
/// file: src/routes/items.js
// @filename: ambient.d.ts
type Item = {
	id: string;
};
type ValidationError = {};

declare module '$lib/database' {
	export const list: () => Promise<Item[]>;
	export const create: (request: Request) => Promise<[Record<string, ValidationError>, Item]>;
}

// @filename: index.js
// ---cut---
import * as db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get() {
	const items = await db.list();

	return {
		body: { items }
	};
}

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ request }) {
	const [errors, item] = await db.create(request);

	if (errors) {
		// バリデーションエラーを返します
		return {
			status: 400,
			body: { errors }
		};
	}

	// 新たに作成された item にリダイレクトします
	return {
		status: 303,
		headers: {
			location: `/items/${item.id}`
		}
	};
}
```

```svelte
/// file: src/routes/items.svelte
<script>
	// このページでは常に `get` で取得したプロパティにアクセスします…
	export let items;

	// …それに加えて、POST リクエストに応答してページがレンダリングされるときに
	// `post` からプロパティを取得します
	// 例えば、以下のようなフォームを送信したあとです
	export let errors;
</script>

{#each items as item}
	<Preview item={item}/>
{/each}

<form method="post">
	<input name="title">

	{#if errors?.title}
		<p class="error">{errors.title}</p>
	{/if}

	<button type="submit">Create item</button>
</form>
```

#### Body parsing

`request` オブジェクトは標準の [Request](https://developer.mozilla.org/ja/docs/Web/API/Request) クラスのインスタンスです。そのため、簡単に request の body にアクセスできます:

```js
// @filename: ambient.d.ts
declare global {
	const create: (data: any) => any;
}

export {};

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function post({ request }) {
	const data = await request.formData(); // or .json(), or .text(), etc

	await create(data);
	return { status: 201 };
}
```

#### Setting cookies

エンドポイント(Endpoints) は `set-cookie` を含む `headers` オブジェクトを返すことで、Cookie を設定することができます。複数の Cookie を同時に設定するには、配列を返します:

```js
// @filename: ambient.d.ts
const cookie1: string;
const cookie2: string;

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').RequestHandler} */
export function get() {
	return {
		headers: {
			'set-cookie': [cookie1, cookie2]
		}
	};
}
```

#### HTTP method overrides

HTML `<form>` 要素は、ネイティブでは `GET` と `POST` メソッドのみをサポートしています。例えば `PUT` や `DELETE` などのその他のメソッドを許可するには、それを [configuration](/docs/configuration#methodoverride) で指定し、`_method=VERB` パラメータ (パラメータ名は設定で変更できます) を form の `action` に追加してください:

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		methodOverride: {
			allowed: ['PUT', 'PATCH', 'DELETE']
		}
	}
};

export default config;
```

```html
<form method="post" action="/todos/{id}?_method=PUT">
	<!-- form elements -->
</form>
```

> ネイティブの `<form>` の挙動を利用することで、JavaScript が失敗したり無効になっている場合でもアプリが動作し続けられます。

### プライベートモジュール

名前が `_` や `.` で始まるファイルやディレクトリ([`.well-known`](https://en.wikipedia.org/wiki/Well-known_URI) は除く) はデフォルトでプライベートで、ルート(routes)を作成しません(ルートを作成するファイルからインポートすることは可能です)。どのモジュールをパブリックまたはプライベートとみなすかについては [`ルート(routes)`](/docs/configuration#routes) 設定で設定することができます。

### 高度なルーティング

#### Restパラメータ

例えば `src/routes/[category]/[item].svelte` や `src/routes/[category]-[item].svelte` のように、ルート(route)は動的なパラメータを複数持つことができます。(パラメータは 'non-greedy' です。`/x-y-z` のようにあいまいなケースでは、`category` は `x` 、 `item` は `y-z` となります) ルートセグメント(route segments)の数が不明な場合は、rest 構文を使用することができます。例えば、GitHubのファイルビューアは次のように実装することができます…

```bash
/[org]/[repo]/tree/[branch]/[...file]
```

…この場合、`/sveltejs/kit/tree/master/documentation/docs/01-routing.md` をリクエストすると、以下のパラメータをページで使うことができます。

```js
// @noErrors
{
	org: 'sveltejs',
	repo: 'kit',
	branch: 'master',
	file: 'documentation/docs/01-routing.md'
}
```

> `src/routes/a/[...rest]/z.svelte` は `/a/z` だけでなく、`/a/b/z` と `/a/b/c/z` にもマッチします。rest パラメータの値が有効であることを必ず確かめてください。

#### ソート

あるパスに対し、マッチするルート(routes)は複数でも構いません。例えば、これらのルート(routes)はどれも `/foo-abc` にマッチします:

```bash
src/routes/[a].js
src/routes/[b].svelte
src/routes/[c].svelte
src/routes/[...catchall].svelte
src/routes/foo-[bar].svelte
```

SvelteKit は、どのルート(route)に対してリクエストされているのかを判断しなければなりません。そのため、以下のルールに従ってこれらをソートします…

- より詳細・明確(specific)なルート(routes)ほど、より優先度が高い
- Standalone endpoints は、同じ詳細度(specificity)のページよりも優先度が高い
- Restパラメータは最も優先度が低い
- 優先度が同じ場合はアルファベット順で解決される

…この順序で並べると、`/foo-abc` の場合は `src/routes/foo-[bar].svelte` を呼び出すことになります:

```bash
src/routes/foo-[bar].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/[c].svelte
src/routes/[...catchall].svelte
```

#### フォールスルールート

まれに、上記の順序では、パスに対してお望みの動きにならないことがあるでしょう。例えば、`/foo-abc` は `src/routes/foo-[bar].svelte` で解決したいけれど `/foo-def` は `src/routes/[b].svelte` で解決したい、というような場合です。

優先度が高いルート(routes)では、`{ fallthrough: true }` を返すことによって優先度が低いルート(routes)に _フォールスルー_ することができます。ページの場合は `load`から、エンドポイントの場合は request handler から `{ fallthrough: true }` を返します:

```svelte
/// file: src/routes/foo-[bar].svelte
<script context="module">
	export function load({ params }) {
		if (params.bar === 'def') {
			return { fallthrough: true };
		}

		// ...
	}
</script>
```

```js
/// file: src/routes/[a].js
// @errors: 2366
/** @type {import('@sveltejs/kit').RequestHandler} */
// ---cut---
export function get({ params }) {
	if (params.a === 'foo-def') {
		return { fallthrough: true };
	}

	// ...
}
```
