---
title: Routing
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
<!-- src/routes/index.svelte -->
<svelte:head>
	<title>Welcome</title>
</svelte:head>

<h1>Hello and welcome to my site!</h1>
```

`src/routes/about.svelte` と `src/routes/about/index.svelte` はどちらも `/about` ルート(route)になります。

```html
<!-- src/routes/about.svelte -->
<svelte:head>
	<title>About</title>
</svelte:head>

<h1>About this site</h1>
<p>TODO...</p>
```

動的なパラメータは `[括弧]` を使用してエンコードされます。例えば、ブログ記事は `src/routes/blog/[slug].svelte` のように定義することがあるでしょう。

ファイルやディレクトリは、`[id]-[category].svelte` のように、動的なパーツを複数持つことができます。(パラメータは 'non-greedy' です。`x-y-z` のようにあいまいなケースでは、`id` は `x` 、 `category` は `y-z` となります)

### Endpoints

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルに記述されるモジュールで、HTTPメソッドに対応した関数をエクスポートします。エンドポイントの役割は、サーバー上でしか利用できないデータ (例えば、データベースやファイルシステムにあるデータ) をページで読み書きできるようにすることです。

```ts
// Type declarations for endpoints (declarations marked with
// an `export` keyword can be imported from `@sveltejs/kit`)

export interface RequestHandler<Output = Record<string, any>> {
	(event: RequestEvent): MaybePromise<
		Either<Output extends Response ? Response : EndpointOutput<Output>, Fallthrough>
	>;
}

export interface RequestEvent {
	request: Request;
	url: URL;
	params: Record<string, string>;
	locals: App.Locals;
	platform: App.Platform;
}

export interface EndpointOutput<Output = Record<string, any>> {
	status?: number;
	headers?: Headers | Partial<ResponseHeaders>;
	body?: Record<string, any>;
}

type MaybePromise<T> = T | Promise<T>;

interface Fallthrough {
	fallthrough: true;
}
```

> `App.Locals` と `App.Platform` については [TypeScript](/docs/typescript) セクションをご参照ください。

エンドポイント(endpoint)とページ(page)が同じファイル名(拡張子を除く)の場合、ページはそのエンドポイントからプロパティ(props)を取得します。つまり、`src/routes/items/[id].svelte` のようなページは、`src/routes/items/[id].js` からプロパティを取得することができるのです:

```js
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
}
```

> エンドポイントを含む全てのサーバーサイドのコードは、外部のAPIにデータをリクエストする場合に備えて、`fetch` にアクセスすることができます。`$lib` のインポートについては心配無用です、それについては[後ほど](/docs/modules#$lib)触れます。

この関数の仕事は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。`status` は [HTTPステータスコード](https://httpstatusdogs.com)です。

- `2xx` — 成功レスポンス (デフォルトは `200`)
- `3xx` — リダイレクション (`location` ヘッダーが必要です)
- `4xx` — クライアントエラー
- `5xx` — サーバーエラー

> `{fallthrough: true}` が返された場合、SvelteKit は何か応答する他のルートに [フォールスルー(fall through)](/docs/routing#advanced-routing-fallthrough-routes) し続けるか、一般的な 404 で応答します。

返される `body` は、ページのプロパティに対応します:

```svelte
<script>
	// エンドポイント(endpoint)からのデータが入力される
	export let item;
</script>

<h1>{item.title}</h1>
```

#### POST, PUT, PATCH, DELETE

エンドポイント(Endpoints)は、HTTP メソッドに対応する関数をエクスポートすることで、`GET` だけでなく任意の HTTP メソッドを扱うことができます:

```js
export function post(event) {...}
export function put(event) {...}
export function patch(event) {...}
export function del(event) {...} // `delete` は予約語 
```

`get` と同様、これらの関数は `body` を返すことができ、それをページにプロパティとして渡されます。`get` からの 4xx/5xx レスポンスはエラーページのレンダリングとなりますが、GET 以外のリクエストに対する同様のレスポンスはそうならないので、フォームのバリデーションエラーのレンダリングのようなことを行うことができます:

```js
// src/routes/items.js
import * as db from '$lib/database';

export async function get() {
	const items = await db.list();

	return {
		body: { items }
	};
}

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
<!-- src/routes/items.svelte -->
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
export async function post({ request }) {
	const data = await request.formData(); // or .json(), or .text(), etc
}
```

#### Setting cookies

エンドポイント(Endpoints) は `set-cookie` を含む `headers` オブジェクトを返すことで、Cookie を設定することができます。複数の Cookie を同時に設定するには、配列を返します:

```js
return {
	headers: {
		'set-cookie': [cookie1, cookie2]
	}
};
```

#### HTTP method overrides

HTML `<form>` 要素は、ネイティブでは `GET` と `POST` メソッドのみをサポートしています。例えば `PUT` や `DELETE` などのその他のメソッドを許可するには、それを [configuration](/docs/configuration#methodoverride) で指定し、`_method=VERB` パラメーター (パラメーター名は設定で変更できます) を form の `action` に追加してください:

```js
// svelte.config.js
export default {
	kit: {
		methodOverride: {
			allowed: ['PUT', 'PATCH', 'DELETE']
		}
	}
};
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

### Private modules

名前が `_` や `.` で始まるファイルやディレクトリ([`.well-known`](https://en.wikipedia.org/wiki/Well-known_URI) は除く) はデフォルトでプライベートで、ルート(routes)を作成しません(ルートを作成するファイルからインポートすることは可能です)。どのモジュールをパブリックまたはプライベートとみなすかについては [`ルート(routes)`](/docs/configuration#routes) 設定で設定することができます。

### Advanced routing

#### Rest parameters

例えば `src/routes/[category]/[item].svelte` や `src/routes/[category]-[item].svelte` のように、ルート(route)は動的なパラメータを複数持つことができます。(パラメータは 'non-greedy' です。`/x-y-z` のようにあいまいなケースでは、`category` は `x` 、 `item` は `y-z` となります) ルートセグメント(route segments)の数が不明な場合は、rest 構文を使用することができます。例えば、GitHubのファイルビューアは次のように実装することができます…

```bash
/[org]/[repo]/tree/[branch]/[...file]
```

…この場合、`/sveltejs/kit/tree/master/documentation/docs/01-routing.md` をリクエストすると、以下のパラメータをページで使うことができます。

```js
{
	org: 'sveltejs',
	repo: 'kit',
	branch: 'master',
	file: 'documentation/docs/01-routing.md'
}
```

> `src/routes/a/[...rest]/z.svelte` は `/a/z` だけでなく、`/a/b/z` と `/a/b/c/z` にもマッチします。rest パラメータの値が有効であることを必ず確かめてください。

#### Fallthrough routes

パスに一致するルート(routes)が複数ある場合、Sveltekit は応答があるまでそれぞれのルート(routes)を試行します。例えば、このようなルート(routes)がある場合…

```bash
src/routes/[baz].js
src/routes/[baz].svelte
src/routes/[qux].svelte
src/routes/foo-[bar].svelte
```

…`/foo-xyz` にアクセスすると、SvelteKit は最初に `foo-[bar].svelte` を試行します、なぜならベストマッチだからです。その後レスポンスがなければ、SvelteKit は `/foo-xyz` に有効にマッチする他のルートを試行します。エンドポイントはページより優先順位が高いため、次に試行されるのは `[baz].js` です。次にアルファベット順で優先順位が決まるので、`[baz].svelte` は `[qux].svelte` より先に試行されます。最初に応答するルート(route) — [`load`](/docs/loading) から何かを返すページ、`load` 関数を持たないページ、または何かを返すエンドポイント — がリクエストを処理します。

どのページやエンドポイントもリクエストに応答しない場合、SvelteKitは一般的な404で応答します。
