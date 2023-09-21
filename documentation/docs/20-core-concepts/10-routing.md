---
title: ルーティング
---

SvelteKit の中心は、 _ファイルシステムベースのルーター_ です。アプリのルート(routes) — 例えばユーザーがアクセスできる URL パス — は、コードベースのディレクトリによって定義されます:

- `src/routes` は最上位のルート(the root route)です 
- `src/routes/about` は `/about` ルート(route)を作成します
- `src/routes/blog/[slug]` は _パラメータ_ `slug` を使ったルート(route)を作成します。パラメータは、ユーザーからのリクエストが `/blog/hello-world` のようなページに行われた場合に、動的にデータを読み込むために使用することができます

> [プロジェクトの設定](configuration) を編集することで、`src/routes` から別のディレクトリに変更することができます。

ルート(route)のディレクトリはそれぞれ1つ以上の _ルートファイル(route files)_ を格納します。ルートファイル(route files)には `+` という接頭辞が付いているので、それで見分けることができます。

## +page

### +page.svelte

`+page.svelte` コンポーネントはアプリのページを定義します。デフォルトでは、ページは最初のリクエストではサーバー ([SSR](glossary#ssr)) でレンダリングされ、その後のナビゲーションではブラウザ ([CSR](glossary#csr)) でレンダリングされます。

```svelte
<!--- file: src/routes/+page.svelte --->
<h1>Hello and welcome to my site!</h1>
<a href="/about">About my site</a>
```

```svelte
<!--- file: src/routes/about/+page.svelte --->
<h1>About this site</h1>
<p>TODO...</p>
<a href="/">Home</a>
```

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<h1>{data.title}</h1>
<div>{@html data.content}</div>
```

> SvelteKit では、ルート(routes)間のナビゲーションに、フレームワーク固有の `<Link>` コンポーネントではなく、`<a>` 要素を使用します。

### +page.js

ページではたびたび、レンダリングの前になんらかのデータを読み込む必要があります。これに対応するため、`load` 関数をエクスポートする `+page.js` モジュールを追加しています:

```js
/// file: src/routes/blog/[slug]/+page.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	if (params.slug === 'hello-world') {
		return {
			title: 'Hello world!',
			content: 'Welcome to our blog. Lorem ipsum dolor sit amet...'
		};
	}

	throw error(404, 'Not found');
}
```

この関数は `+page.svelte` とともに実行されます。サーバーサイドレンダリング中はサーバーで実行され、クライアントサイドナビゲーション中はブラウザで実行されます。API の詳細は [`load`](load) をご参照ください。

`+page.js` では、`load` だけでなくページの動作(behaviour)を設定するための値をエクスポートすることができます:

- `export const prerender = true` または `false` または `'auto'`
- `export const ssr = true` または `false`
- `export const csr = true` または `false`

これらに関するより詳しい情報は [page options](page-options) をご覧ください。

### +page.server.js

`load` 関数をサーバー上でのみ実行できるようにしたい場合 — 例えば、データベースからデータを取得したり、API キーのようなプライベートな[環境変数](modules#$env-static-private)にアクセスしたりする必要がある場合 — `+page.js` を `+page.server.js` にリネームし、`PageLoad` 型を `PageServerLoad` に変更します。

```js
/// file: src/routes/blog/[slug]/+page.server.js

// @filename: ambient.d.ts
declare global {
	const getPostFromDatabase: (slug: string) => {
		title: string;
		content: string;
	}
}

export {};

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const post = await getPostFromDatabase(params.slug);

	if (post) {
		return post;
	}

	throw error(404, 'Not found');
}
```

クライアントサイドナビゲーション中は、SvelteKit はサーバーからこのデータを読み込みます。つまり、その戻り値は [devalue](https://github.com/rich-harris/devalue) によってシリアライズできなければならないということです。この API の詳細については [`load`](load) をご参照ください。

`+page.js` のように、`+page.server.js` は [page options](page-options) (`prerender`、`ssr`、`csr`) をエクスポートできます。

また、`+page.server.js` ファイルは _actions_ をエクスポートできます。`load` がサーバーからデータを読み取る場合、`actions` は `<form>` 要素を使用してサーバーにデータを書き込むことができます。これらの使い方を学ぶには、[form actions](form-actions) セクションをご参照ください。

## +error

`load` 中にエラーが発生した場合、SvelteKit はデフォルトのエラーページをレンダリングします。`+error.svelte` を追加することで、ルート(route) ごとにエラーページをカスタマイズすることができます:

```svelte
<!--- file: src/routes/blog/[slug]/+error.svelte --->
<script>
	import { page } from '$app/stores';
</script>

<h1>{$page.status}: {$page.error.message}</h1>
```

SvelteKit は、ツリーを上がって (walk up the tree) 最も近いエラー境界 (error boundary) を探します — もし上記のファイルが存在しない場合は、デフォルトのエラーページをレンダリングする前に `src/routes/blog/+error.svelte` を探しに行き、その次に `src/routes/+error.svelte` を探します。もしそれも失敗した場合は (または、最上位の `+error` の '上に' 位置する最上位の `+layout` の `load` 関数からエラーがスローされた場合)、SvelteKit は静的なフォールバックエラーページをレンダリングします。これは `src/error.html` ファイルを作成することでカスタマイズ可能です。

`+layout(.server).js` の `load` 関数の内側でエラーが発生した場合、ツリーの中で最も近くにあるエラー境界はそのレイアウトの上位にある `+error.svelte` ファイルです (隣ではありません)。

ルート(route)が見つからない場合 (404)、`src/routes/+error.svelte` (または、もしこのファイルが存在しない場合はデフォルトのエラーページ) が使われます。

> エラーが [`handle`](hooks#server-hooks-handle) の内側や [+server.js](#server) リクエストハンドラ の内側で発生した場合は、`+error.svelte` は使用されません。

エラーハンドリングに関する詳細は [こちら](errors) からお読み頂けます。

## +layout

これまで、ページを完全に独立したコンポーネントとして扱ってきました — ナビゲーションを行うと、既存の `+page.svelte` コンポーネントが破棄され、新しいページコンポーネントで置き換えられます。

しかし多くのアプリでは、トップレベルのナビゲーションやフッターのように _全ての_ ページで表示されるべき要素があります。全ての `+page.svelte` にそれらを繰り返し配置する代わりに、_レイアウト(layouts)_ に配置することができます。

### +layout.svelte

全てのページに適用するレイアウトを作成するには、`src/routes/+layout.svelte` というファイルを作成します。デフォルトのレイアウト (あなたが作成していない場合に SvelteKit が使用するもの) は以下のようなものです…

```html
<slot></slot>
```

…しかし、お望みのマークアップ(markup)、スタイル(styles)、動作(behaviour)を追加することができます。唯一の要求事項は、コンポーネントにページコンテンツのための `<slot>` を含めることです。例えば、nav bar を追加してみましょう:

```html
/// file: src/routes/+layout.svelte
<nav>
	<a href="/">Home</a>
	<a href="/about">About</a>
	<a href="/settings">Settings</a>
</nav>

<slot></slot>
```

`/`、`/about`、`/settings` のためのページを作成する場合…

```html
/// file: src/routes/+page.svelte
<h1>Home</h1>
```

```html
/// file: src/routes/about/+page.svelte
<h1>About</h1>
```

```html
/// file: src/routes/settings/+page.svelte
<h1>Settings</h1>
```

… nav は常に表示され、3つのページのための a 要素をそれぞれクリックしても `<h1>` が置き換わるだけです。

レイアウトは _ネスト_ させることができます。例えば、単一の `/settings` ページだけでなく、`/settings/profile` や `/settings/notifications` のような共有のサブメニューを持つネストしたページがあるとします (実例としては、[github.com/settings](https://github.com/settings) をご参照ください)。

`/settings` 配下のページにのみ適用されるレイアウトを作成することができます (トップレベルの nav を持つ最上位のレイアウト(root layout)を継承しています):

```svelte
<!--- file: src/routes/settings/+layout.svelte --->
<script>
	/** @type {import('./$types').LayoutData} */
	export let data;
</script>

<h1>Settings</h1>

<div class="submenu">
	{#each data.sections as section}
		<a href="/settings/{section.slug}">{section.title}</a>
	{/each}
</div>

<slot></slot>
```

デフォルトでは、各レイアウトはその上にあるレイアウトを継承します。そうしたくない場合は、[advanced layouts](advanced-routing#advanced-layouts) が役に立つでしょう。

### +layout.js

`+page.svelte` が `+page.js` からデータを読み込むように、`+layout.svelte` コンポーネントは `+layout.js` の [`load`](load) 関数からデータを取得することができます。

```js
/// file: src/routes/settings/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return {
		sections: [
			{ slug: 'profile', title: 'Profile' },
			{ slug: 'notifications', title: 'Notifications' }
		]
	};
}
```

`+layout.js` が [page options](page-options) (`prerender`、`ssr`、`csr`) をエクスポートする場合、それは子ページのデフォルトとしても使用されます。

レイアウトの `load` 関数から返されるデータは全ての子ページで利用することができます:

```svelte
<!--- file: src/routes/settings/profile/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;

	console.log(data.sections); // [{ slug: 'profile', title: 'Profile' }, ...]
</script>
```

> しばしば、ページ間を移動しているときにレイアウトデータが変更されないことがあります。SvelteKit は必要に応じてインテリジェントに [`load`](load) 関数を再実行します。

### +layout.server.js

サーバー上でレイアウトの `load` 関数を実行するためには、それを `+layout.server.js` に移動し、`LayoutLoad` 型を `LayoutServerLoad` に変更します。

`+layout.js` と同様に、`+layout.server.js` では [page options](page-options) — `prerender`、`ssr`、`csr` をエクスポートすることができます。

## +server

ページと同様に、`+server.js` ファイル (よく 'API ルート(API route)' または 'エンドポイント(endpoint)' とも呼ばれる) でルート(routes) を定義でき、これによってレスポンスを完全にコントロールすることができます。`+server.js` ファイル は `GET`、`POST`、`PATCH`、`PUT`、`DELETE`、`OPTIONS`、`HEAD` といった HTTP verbs に対応する関数をエクスポートします。これは `RequestEvent` を引数に取り、[`Response`](https://developer.mozilla.org/ja/docs/Web/API/Response) オブジェクトを返します。

例えば、`GET` ハンドラーを使用した `/api/random-number` ルート(route)を作成できます:

```js
/// file: src/routes/api/random-number/+server.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ url }) {
	const min = Number(url.searchParams.get('min') ?? '0');
	const max = Number(url.searchParams.get('max') ?? '1');

	const d = max - min;

	if (isNaN(d) || d < 0) {
		throw error(400, 'min and max must be numbers, and min must be less than max');
	}

	const random = min + Math.random() * d;

	return new Response(String(random));
}
```

`Response` の第一引数には [`ReadableStream`](https://developer.mozilla.org/ja/docs/Web/API/ReadableStream) を指定することができ、大量のデータをストリームしたり、server-sent events を作成したりすることができます (AWS Lambda のような、レスポンスをバッファするプラットフォームにデプロイする場合は除きます)。

便宜上、`@sveltejs/kit` の [`error`](modules#sveltejs-kit-error)、[`redirect`](modules#sveltejs-kit-redirect)、[`json`](modules#sveltejs-kit-json) メソッドを使用することは可能です (ただし、使用する必要はありません)。

エラーがスローされる場合 (`throw error(...)` によるスローや、予期せぬエラーがスローされるどちらでも)、レスポンスは `Accept` ヘッダーに応じて、そのエラーの JSON 表現か、`src/error.html` でカスタマイズすることができるフォールバックエラーページとなります。この場合、[`+error.svelte`](#error) コンポーネントはレンダリングされません。エラーハンドリングに関する詳細は [こちら](errors) からお読み頂けます。

> `OPTIONS` ハンドラを作成する場合、Vite が `Access-Control-Allow-Origin` ヘッダーと `Access-Control-Allow-Methods` ヘッダーを注入することにご注意ください。本番環境では、あなたが明示的に追加しない限り注入されないはずです。

### Receiving data

`+server.js` ファイルは、`POST`/`PUT`/`PATCH`/`DELETE`/`OPTIONS`/`HEAD` ハンドラをエクスポートすることで、完全な API を作成することができます:

```svelte
<!--- file: src/routes/add/+page.svelte --->
<script>
	let a = 0;
	let b = 0;
	let total = 0;

	async function add() {
		const response = await fetch('/api/add', {
			method: 'POST',
			body: JSON.stringify({ a, b }),
			headers: {
				'content-type': 'application/json'
			}
		});

		total = await response.json();
	}
</script>

<input type="number" bind:value={a}> +
<input type="number" bind:value={b}> =
{total}

<button on:click={add}>Calculate</button>
```

```js
/// file: src/routes/api/add/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	const { a, b } = await request.json();
	return json(a + b);
}
```

> 一般的には、ブラウザからサーバーにデータを送信する方法としては [form actions](form-actions) のほうがより良い方法です。

### Content negotiation

`+server.js` ファイルは `+page` ファイルと同じディレクトリに置くことができ、これによって同じルート(route)がページにも API エンドポイントにもなるようにすることができます。これがどちらなのか判断するために、SvelteKit は以下のルールを適用します:

- `PUT`/`PATCH`/`DELETE`/`OPTIONS` リクエストは、ページには適用されないため、常に `+server.js` で処理されます。
- `GET`/`POST`/`HEAD` リクエストは、`accept` ヘッダーが `text/html` を優先している場合 (言い換えると、ブラウザのページリクエストの場合)、ページリクエストとして扱われます。それ以外の場合は `+server.js` で処理されます。
- `GET` リクエストに対するレスポンスには `Vary: Accept` ヘッダーが含まれるため、プロキシーやブラウザは HTML と JSON のレスポンスを別々にキャッシュします。

## $types

これまでの例を通してずっと、`$types.d.ts` ファイルからインポートしてきました。これは、TypeScript (または JavaScript を JSDoc の型アノテーションと) 使用している場合に最上位のファイル(root files)を扱う際に型の安全性をもたらすために SvelteKit が隠しディレクトリに作成するファイルです。

例えば、`export let data` に `PageData` (または `LayoutData` の場合は `+layout.svelte` ファイル) にアノテーションを付けると、`data` の型は `load` の戻り値であると TypeScript に伝えることができます:

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>
```

`load` 関数に `PageLoad`、`PageServerLoad`、`LayoutLoad`、`LayoutServerLoad` (それぞれ `+page.js`、`+page.server.js`、`+layout.js`、`+layout.server.js`) というアノテーションを付けると、`params` と戻り値が正しく型付けされることが保証されるでしょう。

VS Code や、language server protocol と TypeScript plugin をサポートする IDE を使用している場合は、これらの型を _完全に_ 省略することができます！ Svelte の IDE ツール類があなたのために正しい型を挿入してくれるので、あなたはご自身で型を書くことなく型チェックすることができます。これはコマンドラインツール `svelte-check` でも機能します。

`$types` の省略については、私たちの[ブログ記事](https://svelte.jp/blog/zero-config-type-safety)でより詳細な情報をお読み頂けます。

## その他のファイル <!--other-files-->

ルート(route)ディレクトリ内のその他のファイルは SvelteKit から無視されます。つまり、コンポーネントやユーティリティモジュールを、それらを必要とするルート(routes)に配置することができます。

コンポーネントやモジュールが複数のルート(routes)から必要な場合、[`$lib`](modules#$lib) にそれらを配置すると良いでしょう。

## その他の参考資料 <!--further-reading-->

- [Tutorial: Routing](https://learn.svelte.jp/tutorial/pages)
- [Tutorial: API routes](https://learn.svelte.jp/tutorial/get-handlers)
- [Docs: Advanced routing](advanced-routing)
