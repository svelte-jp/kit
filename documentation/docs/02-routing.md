---
title: ルーティング
---

Sveltekitの核心は、 _ファイルシステムベースのルーター_ です。これは、アプリケーション構造がコードベースの構造(具体的には `src/routes` のコンテンツ)によって定義されることを意味します。

> [プロジェクトのコンフィグ](/docs/configuration) を編集することで、これを異なるディレクトリに変更できます。

ルートには、**ページ(pages)** と **エンドポイント(endpoints)** の2つのタイプがあります。

ページは通常、ユーザーに表示するHTML(及びページに必要なCSSやJavaScript)を生成します。デフォルトでは、ページはクライアントとサーバーの両方でレンダリングされますが、この動作は設定によって変更可能です。

エンドポイントは、サーバー上でのみ実行されます(もしくはサイトをビルドするときに[プリレンダリング](/docs/page-options#prerender)している場合)。これは、プライベートな認証情報を必要とするデータベースやAPIにアクセスする場合や、本番環境ネットワーク上のマシンにあるデータを返す場合などに使用されます。ページはエンドポイントにデータをリクエストすることができます。エンドポイントはデフォルトではJSONを返しますが、他のフォーマットでもデータを返すことができます。

### ページ(Pages)

ページ(Pages)は `.svelte` ファイル (または[`config.extensions`](/docs/configuration) に記載されている拡張子のファイル) に書かれているSvelteコンポーネントです。デフォルトでは、ユーザーが初めてアプリにアクセスすると、サーバーレンダリングバージョンのページと、そのページを'ハイドレート(hydrate)'しクライアントサイドルーターを初期化するJavaScriptが提供されます。それ以降、他のページへのナビゲーションは全てクライアント側で処理され、ページの共通部分を再レンダリングする必要がなくなるため、高速でアプリのような操作感になります。

ファイル名でルート(**route**)が決まります。例えば、`src/routes/index.svelte` はサイトのルート(**root**)になります。

```html
/// file: src/routes/index.svelte
<svelte:head>
	<title>Welcome</title>
</svelte:head>

<h1>Hello and welcome to my site!</h1>

<a href="/about">About my site</a>
```

`src/routes/about.svelte` と `src/routes/about/index.svelte` はどちらも `/about` ルート(route)になります。

```html
/// file: src/routes/about.svelte
<svelte:head>
	<title>About</title>
</svelte:head>

<h1>About this site</h1>
<p>TODO...</p>

<a href="/">Home</a>
```

> Note that SvelteKit uses `<a>` elements to navigate between routes, rather than a framework-specific `<Link>` component.

Dynamic parameters are encoded using `[brackets]`. For example, a blog post might be defined by `src/routes/blog/[slug].svelte`. These parameters can be accessed in a [`load`](/docs/loading#input-params) function or via the [`page`](/docs/modules#$app-stores) store.

A route can have multiple dynamic parameters, for example `src/routes/[category]/[item].svelte` or even `src/routes/[category]-[item].svelte`. (Parameters are 'non-greedy'; in an ambiguous case like `x-y-z`, `category` would be `x` and `item` would be `y-z`.)

### エンドポイント(Endpoints)

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルに記述されるモジュールで、HTTP メソッドに対応する [request handler](/docs/types#sveltejs-kit-requesthandler) 関数をエクスポートします。サーバー上でのみ利用可能なデータ(例えば、データベースやファイルシステムにあるデータ) を読み書きできるようにするという役割があります。

```js
/// file: src/routes/items/[id].js
// @filename: ambient.d.ts
type Item = {};

declare module '$lib/database' {
	export const get: (id: string) => Promise<Item>;
}

// @filename: __types/[id].d.ts
import type { RequestHandler as GenericRequestHandler } from '@sveltejs/kit';
export type RequestHandler<Body = any> = GenericRequestHandler<{ id: string }, Body>;

// @filename: index.js
// ---cut---
import db from '$lib/database';

/** @type {import('./__types/[id]').RequestHandler} */
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
}
```

> `$lib` のインポートについては心配無用です、それについては[後ほど](/docs/modules#$lib)触れます。

上記の `get` 関数の型は、SvelteKit が ([`outDir`](/docs/configuration#outdir) の中に、[`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) オプションを使用して) 生成する `./[id].d.ts` ファイルにあり、`params` にアクセスするときの型安全性を提供します。詳細は [generated types](/docs/types#generated-types) をご覧ください。

この [request handler](/docs/types#sveltejs-kit-requesthandler) の役割は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。`status` は [HTTPステータスコード](https://httpstatusdogs.com)です。

- `2xx` — 成功レスポンス (デフォルトは `200`)
- `3xx` — リダイレクション (`location` ヘッダーが必要です)
- `4xx` — クライアントエラー
- `5xx` — サーバーエラー

#### ページエンドポイント(Page endpoints)

エンドポイントとページのファイル名が(拡張子以外)同一である場合、そのページはその同名のファイルを持つエンドポイントからプロパティ(props)を取得します (クライアントサイドナビゲーションの時は `fetch` が使用され、SSRの時には直接その関数を呼び出します)。

`src/routes/items/[id].svelte` というページの場合は、上記のエンドポイント(`src/routes/items/[id].js`)の `body` からプロパティを取得します:

```svelte
/// file: src/routes/items/[id].svelte
<script>
	// エンドポイント(endpoint)からデータが取得される
	export let item;
</script>

<h1>{item.title}</h1>
```

ページとエンドポイントが同じURLになるため、ページから HTML を取得するのではなくエンドポイントから JSON を取得するときは `accept: application/json` ヘッダーを付ける必要があります。また、URL に `/__data.json` を追加することで(例: `/items/[id]/__data.json`)、生データ(raw data)を取得できます。

#### スタンドアロンエンドポイント(Standalone endpoints)

通常、エンドポイントはペアとなるページにデータを提供するために置きます。しかし、ページとは独立して置くこともできます。スタンドアロンエンドポイント(Standalone endpoints)は、返す `body` の型について少し柔軟で、オブジェクトに加えて、`Uint8Array` を返すこともできます。

スタンドアロンエンドポイントには必要に応じてファイル拡張子を付けることができますし、付けなければ直接アクセスすることができます:

| ファイル名                      | エンドポイント |
| ----------------------------- | ---------- |
| src/routes/data/index.json.js | /data.json |
| src/routes/data.json.js       | /data.json |
| src/routes/data/index.js      | /data      |
| src/routes/data.js            | /data      |

> streaming request body、response body については[今後サポートされる予定](https://github.com/sveltejs/kit/issues/3419)です。

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

// @filename: __types/items.d.ts
import type { RequestHandler as GenericRequestHandler } from '@sveltejs/kit';
export type RequestHandler<Body = any> = GenericRequestHandler<{}, Body>;

// @filename: index.js
// ---cut---
import * as db from '$lib/database';

/** @type {import('./__types/items').RequestHandler} */
export async function get() {
	const items = await db.list();

	return {
		body: { items }
	};
}

/** @type {import('./__types/items').RequestHandler} */
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

If the number of route segments is unknown, you can use rest syntax — for example you might implement GitHub's file viewer like so...

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

> `src/routes/a/[...rest]/z.svelte` will match `/a/z` (i.e. there's no parameter at all) as well as `/a/b/z` and `/a/b/c/z` and so on. Make sure you check that the value of the rest parameter is valid, for example using a [matcher](#advanced-routing-matching).

#### Matching

`src/routes/archive/[page]` のようなルート(route)は `/archive/3` にマッチしますが、`/archive/potato` にもマッチしてしまいます。これを防ぎたい場合、パラメータ文字列(`"3"` や `"potato"`)を引数に取ってそれが有効なら `true` を返す _matcher_ を [`params`](/docs/configuration#files) ディレクトリに追加することで、ルート(route)のパラメータを適切に定義することができます…

```js
/// file: src/params/integer.js
/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
	return /^\d+$/.test(param);
}
```

…そしてルート(routes)を拡張します:

```diff
-src/routes/archive/[page]
+src/routes/archive/[page=integer]
```

もしパス名がマッチしない場合、SvelteKit は (後述のソート順の指定に従って) 他のルートでマッチするか試行し、どれにもマッチしない場合は最終的に 404 を返します。

> Matchers run both on the server and in the browser.

#### ソート

あるパスに対し、マッチするルート(routes)は複数でも構いません。例えば、これらのルート(routes)はどれも `/foo-abc` にマッチします:

```bash
src/routes/[...catchall].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/foo-[c].svelte
```

SvelteKit は、どのルート(route)に対してリクエストされているのかを判断しなければなりません。そのため、以下のルールに従ってこれらをソートします…

- より詳細・明確(specific)なルート(routes)ほど、より優先度が高い
- Standalone endpoints は、同じ詳細度(specificity)のページよりも優先度が高い
- [matchers](#advanced-routing-matching) 付きのパラメータ (`[name=type]`) は matchers なしのパラメータ (`[name]`) よりも優先度が高い
- Restパラメータは最も優先度が低い
- 優先度が同じ場合はアルファベット順で解決される

…この順序で並べると、`/foo-abc` の場合は `src/routes/foo-[bar].svelte` を呼び出すことになります:

```bash
src/routes/foo-[c].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/[...catchall].svelte
```
