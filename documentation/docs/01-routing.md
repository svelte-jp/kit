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

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルに記述されるモジュールで、HTTPメソッドに対応した関数をエクスポートします。エンドポイントの役割は、サーバー上でしか利用できないデータ (例えば、データベースやファイルシステムにあるデータ) をページで読み書きできるようにすることです。

ページと同じファイル名(拡張子を除く)のエンドポイントがある場合、そのページはそのエンドポイントからプロパティ(props)を取得します。つまり、`src/routes/items/[id].svelte` というページは、下記のファイルからプロパティを取得します:

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

この関数の仕事は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。`status` は [HTTPステータスコード](https://httpstatusdogs.com)です。

- `2xx` — 成功レスポンス (デフォルトは `200`)
- `3xx` — リダイレクション (`location` ヘッダーが必要です)
- `4xx` — クライアントエラー
- `5xx` — サーバーエラー

> `{fallthrough: true}` が返された場合、SvelteKit は何か応答する他のルートに [フォールスルー](/docs/routing#advanced-routing-fallthrough-routes) し続けるか、一般的な 404 で応答します。

返される `body` は、ページのプロパティに対応します:

```svelte
/// file: src/routes/items/[id].svelte
<script>
	// エンドポイント(endpoint)からのデータが入力される
	export let item;
</script>

<h1>{item.title}</h1>
```

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

もし `accept: application/json` header を付けてルート(route)をリクエストすると、SvelteKit は HTML のページではなく エンドポイントのデータを JSON としてレンダリングします。

#### Body parsing

`request` オブジェクトは標準の [Request](https://developer.mozilla.org/ja/docs/Web/API/Request) クラスのインスタンスです。そのため、request の body にアクセスするのは簡単です:

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

### Standalone endpoints

ほとんどの場合、エンドポイント(endpoints)はペアとなるページにデータを提供するために存在します。しかし、ページとは別に存在することもできます。独立したエンドポイント(Standalone endpoints)は、返される `body` の型について少し柔軟です。オブジェクトに加え、文字列や `Uint8Array` を返すことができます。

> streaming request body、response body については[サポートされる予定](https://github.com/sveltejs/kit/issues/3419)です。

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

#### Sorting

It's possible for multiple routes to match a given path. For example each of these routes would match `/foo-abc`:

```bash
src/routes/[a].js
src/routes/[b].svelte
src/routes/[c].svelte
src/routes/[...catchall].svelte
src/routes/foo-[bar].svelte
```

SvelteKit needs to know which route is being requested. To do so, it sorts them according to the following rules...

- More specific routes are higher priority
- Standalone endpoints have higher priority than pages with the same specificity
- Rest parameters have lowest priority
- Ties are resolved alphabetically

...resulting in this ordering, meaning that `/foo-abc` will invoke `src/routes/foo-[bar].svelte` rather than a less specific route:

```bash
src/routes/foo-[bar].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/[c].svelte
src/routes/[...catchall].svelte
```

#### Fallthrough routes

In rare cases, the ordering above might not be want you want for a given path. For example, perhaps `/foo-abc` should resolve to `src/routes/foo-[bar].svelte`, but `/foo-def` should resolve to `src/routes/[b].svelte`.

Higher priority routes can _fall through_ to lower priority routes by returning `{ fallthrough: true }`, either from `load` (for pages) or a request handler (for endpoints):

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
