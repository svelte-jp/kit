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

> SvelteKit ではルート(routes)間のナビゲートに、フレームワーク固有の `<Link>` コンポーネントではなく、`<a>` 要素を使用します。

動的なパラメータは `[カッコ]` を使用してエンコードされます。例えば、ブログ記事の場合は `src/routes/blog/[slug].svelte` のように定義することがあるでしょう。これらのパラメータは、[`load`](/docs/loading#input-params) 関数の中からアクセスできますし、[`page`](/docs/modules#$app-stores) ストアを使用してアクセスすることもできます。

ルート(route)は動的なパラメータを複数持つことができます。例えば、`src/routes/[category]/[item].svelte` や `src/routes/[category]-[item].svelte` といった具合です。(パラメータは 'non-greedy' です; `x-y-z` のような曖昧なケースの場合、`category` は `x`、`item` は `y-z` になります。)

### エンドポイント(Endpoints)

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルに記述されるモジュールで、HTTP メソッドに対応する [Request handler](/docs/types#sveltejs-kit-requesthandler) 関数をエクスポートします。Request handler によって、サーバー上でのみ利用可能なデータ(例えば、データベースやファイルシステムにあるデータ) を読み書きできるようになります。

その役割は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。

```js
/// file: src/routes/random.js
/** @type {import('@sveltejs/kit').RequestHandler} */
export async function GET() {
	return {
		status: 200,
		headers: {
			'access-control-allow-origin': '*'
		},
		body: {
			number: Math.random()
		}
	};
}
```

- `status` は [HTTP ステータスコード](https://httpstatusdogs.com) です:
  - `2xx` — 成功レスポンス (デフォルトは `200`)
  - `3xx` — リダイレクション (`location` ヘッダーも一緒に返す必要があります)
  - `4xx` — クライアントエラー
  - `5xx` — サーバーエラー
- `headers` は上記のようなプレーンなオブジェクトにすることも、[`Headers`](https://developer.mozilla.org/ja/docs/Web/API/Headers) クラスのインスタンスにすることも可能です。
- `body` はプレーンなオブジェクトにすることも可能ですし、もし何かエラーがあった場合は [`Error`](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error) にすることも可能です。JSON にシリアライズされます

`GET` や `HEAD` のレスポンスには `body` が含まれていなければなりませんが、その制約を超えて、3つのプロパティは全てオプションです。

#### ページエンドポイント(Page endpoints)

エンドポイントが(拡張子を除いて)ページと同じファイル名の場合、そのページはエンドポイントから、クライアントサイドナビゲーションの場合は `fetch` を通じて、SSR の場合は直接関数をコールすることで、プロパティ(props)を取得します。(もしページが [名前付きレイアウト(named layouts)](/docs/layouts#named-layouts) や [matchers](/docs/routing#advanced-routing-matching) の構文をそのファイル名に使用している場合、対応するページエンドポイントのファイル名にもそれらが含まれていなければなりません。)

例えば、`src/routes/items/[id].svelte` というページがある場合…

```svelte
/// file: src/routes/items/[id].svelte
<script>
	// エンドポイントからデータが入力される
	export let item;
</script>

<h1>{item.title}</h1>
```

…ペアとなる `src/routes/items/[id].js` エンドポイント (`$lib` のインポートについては [後ほど](/docs/modules#$lib) 説明するのでご心配なく) は:

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
export async function GET({ params }) {
	// `params.id` comes from [id].js
	const item = await db.get(params.id);

	if (item) {
		return {
			status: 200,
			headers: {},
			body: { item }
		};
	}

	return {
		status: 404
	};
}
```

> 上記の `GET` 関数の型は `./__types/[id].d.ts` から取得できますが、このファイルは SvelteKit が ([`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) オプションを使用し、[`outDir`](/docs/configuration#outdir) の中に) 生成し、 `params` にアクセスするときの型安全性を提供します。詳細は [generated types](/docs/types#generated-types) セクションをご参照ください。

ページの代わりに生データ(raw data)を取得するには、リクエストに `accept: application/json` ヘッダーを含めるか、もしくは、お手軽に `/__data.json` を URL に付与します。例えば、`/items/[id]/__data.json` です。

#### スタンドアロンエンドポイント(Standalone endpoints)

大抵の場合、エンドポイント(endpoints)はペアになっているページ(page)にデータを提供するために存在します。しかし、ページとは独立して存在することもできます。スタンドアロンエンドポイント(Standalone endpoints)は返す `body` の型についてより柔軟性があり、オブジェクトや [`Error`](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error) のインスタンスに加えて、[`Uint8Array`](https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) や [`ReadableStream`](https://developer.mozilla.org/ja/docs/Web/API/ReadableStream) を返すことができます。

スタンドアロンエンドポイントには必要に応じてファイル拡張子を付けることができますし、付けなければ直接アクセスすることができます:

| ファイル名                      | エンドポイント |
| ----------------------------- | ---------- |
| src/routes/data/index.json.js | /data.json |
| src/routes/data.json.js       | /data.json |
| src/routes/data/index.js      | /data      |
| src/routes/data.js            | /data      |

#### POST, PUT, PATCH, DELETE

エンドポイント(Endpoints)は、HTTP メソッドに対応する関数をエクスポートすることで、`GET` だけでなく任意の HTTP メソッドを扱うことができます:

```js
// @noErrors
export function POST(event) {...}
export function PUT(event) {...}
export function PATCH(event) {...}
export function DELETE(event) {...}
```

These functions can, like `GET`, return a `body` that will be passed to the page as props. Whereas 4xx/5xx responses from `GET` will result in an error page rendering, similar responses to non-GET requests do not, allowing you to do things like render form validation errors:
`GET` などの関数はプロパティ(props)としてページに渡される `body` を返すことができます。`GET` からの 4xx/5xx レスポンスはエラーページのレンダリングとなりますが、GET 以外のリクエストに対する同様のレスポンスではそうならないため、フォームバリデーションエラーのレンダリングのようなことを行うことができます:

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
export async function GET() {
	const items = await db.list();

	return {
		body: { items }
	};
}

/** @type {import('./__types/items').RequestHandler} */
export async function POST({ request }) {
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
	// ページは通常、`GET` からのプロパティ(props)にアクセスします…
	export let items;

	// …それに加えて、POST リクエストに応答してページがレンダリングされるときに
	// `POST` からプロパティを取得します
	// 例えば、以下のフォームをサブミットしたあとです
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
export async function POST({ request }) {
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
export function GET() {
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

ルート(route) セグメントの数がわからない場合は、rest 構文を使用することができます。例えば GitHub のファイルビューアのようなものを実装する場合には…

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

> `src/routes/a/[...rest]/z.svelte` は `/a/z` (つまり、パラメータがない場合) にマッチしますし、`/a/b/z` や `/a/b/c/z` などにもマッチします。rest パラメータの値が有効であることを、例えば [matcher](#advanced-routing-matching) などを使用して、確実にチェックしてください。

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

> Matcher は サーバーとブラウザの両方で動作します。

#### ソート

あるパスに対し、マッチするルート(routes)は複数でも構いません。例えば、これらのルート(routes)はどれも `/foo-abc` にマッチします:

```bash
src/routes/[...catchall].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/foo-[c].svelte
src/routes/foo-abc.svelte
```

SvelteKit は、どのルート(route)に対してリクエストされているのかを判断しなければなりません。そのため、以下のルールに従ってこれらをソートします…

- より詳細・明確(specific)なルート(routes)ほど、より優先度が高い (例えば、動的なパラメーターが1つあるルートより、パラメーターのないルートのほうがより詳細・明確(specific)である、など)
- スタンドアロンエンドポイント(Standalone endpoints)は、同じ詳細度(specificity)のページよりも優先度が高い
- [matchers](#advanced-routing-matching) 付きのパラメーター (`[name=type]`) は matchers なしのパラメーター (`[name]`) よりも優先度が高い
- Rest パラメーターは最も優先度が低い
- 優先度が同じ場合はアルファベット順で解決される

…この順序で並べると、`/foo-abc` の場合は `src/routes/foo-abc.svelte` を呼び出し、`/foo-def` の場合は `src/routes/foo-[c].svelte` を呼び出します:

```bash
src/routes/foo-abc.svelte
src/routes/foo-[c].svelte
src/routes/[a].js
src/routes/[b].svelte
src/routes/[...catchall].svelte
```

#### Encoding

ファイル名は URI デコードされるので、例えば `%40[username].svelte` は `@` で始まる文字にマッチします:

```js
// @filename: ambient.d.ts
declare global {
	const assert: {
		equal: (a: any, b: any) => boolean;
	};
}

export {};

// @filename: index.js
// ---cut---
assert.equal(
	decodeURIComponent('%40[username].svelte'),
	'@[username].svelte'
);
```

`%` 文字を表すには `%25` を使用してください。そうしないと、不正確な結果となります。
