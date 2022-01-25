---
title: Routing
---

Sveltekitの核心は、 _ファイルシステムベースのルーター_ です。これは、アプリケーション構造がコードベースの構造(具体的には `src/routes` のコンテンツ)によって定義されることを意味します。

> [プロジェクトのコンフィグ](#configuration) を編集することで、これを異なるディレクトリに変更できます。

ルートには、**ページ(pages)** と **エンドポイント(endpoints)** の2つのタイプがあります。

ページは通常、ユーザーに表示するHTML(及びページに必要なCSSやJavaScript)を生成します。デフォルトでは、ページはクライアントとサーバーの両方でレンダリングされますが、この動作は設定によって変更可能です。

エンドポイントは、サーバー上でのみ実行されます(もしくはサイトをビルドするときに[プリレンダリング](#page-options-prerender)している場合)。これは、プライベートな認証情報を必要とするデータベースやAPIにアクセスする場合や、本番環境ネットワーク上のマシンにあるデータを返す場合などに使用されます。ページはエンドポイントにデータをリクエストすることができます。エンドポイントはデフォルトではJSONを返しますが、他のフォーマットでもデータを返すことができます。

### Pages

ページ(Pages)は `.svelte` ファイル (または[`config.extensions`](#configuration) に記載されている拡張子のファイル) に書かれているSvelteコンポーネントです。デフォルトでは、ユーザーが初めてアプリにアクセスすると、サーバーレンダリングバージョンのページと、そのページを'ハイドレート(hydrate)'しクライアントサイドルーターを初期化するJavaScriptが提供されます。それ以降、他のページへのナビゲーションは全てクライアント側で処理され、ページの共通部分を再レンダリングする必要がなくなるため、高速でアプリのような操作感になります。

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

動的なパラメータは `[括弧]` を使用してエンコードされます。例えば、ブログ記事は `src/routes/blog/[slug].svelte` のように定義することがあるでしょう。後ほど、[load function](#loading) や [page store](#modules-$app-stores) でそのパラメータにアクセスする方法をご覧いただけます。

ファイルやディレクトリは、`[id]-[category].svelte` のように、動的なパーツを複数持つことができます。(パラメータは 'non-greedy' です。`x-y-z` のようにあいまいなケースでは、`id` は `x` 、 `category` は `y-z` となります)

### Endpoints

エンドポイント(Endpoints)は `.js` (または `.ts`) ファイルで書かれたモジュールで、HTTPメソッドに対応した関数をエクスポートします。

```ts
// Declaration types for Endpoints
// * declarations that are not exported are for internal use

export interface RequestEvent<Locals = Record<string, any>> {
	request: Request;
	url: URL;
	params: Record<string, string>;
	locals: Locals;
}

type Body = JSONString | Uint8Array | ReadableStream | stream.Readable;
export interface EndpointOutput {
	status?: number;
	headers?: HeadersInit;
	body?: Body;
}

type MaybePromise<T> = T | Promise<T>;
interface Fallthrough {
	fallthrough: true;
}
export interface RequestHandler<Locals = Record<string, any>> {
	(event: RequestEvent<Locals>): MaybePromise<Either<Response | EndpointOutput, Fallthrough>>;
}
```

例えば、仮想的なブログページ `/blog/cool-article` が `/blog/cool-article.json` というデータをリクエストする場合は、`src/routes/blog/[slug].json.js` というエンドポイントになるかもしれません。

```js
import db from '$lib/database';

/** @type {import('@sveltejs/kit').RequestHandler} */
export async function get({ params }) {
	// the `slug` parameter is available because this file
	// is called [slug].json.js
	const article = await db.get(params.slug);

	if (article) {
		return {
			body: {
				article
			}
		};
	}

	return {
		status: 404
	};
}
```

> エンドポイントを含む全てのサーバーサイドのコードは、外部のAPIにデータをリクエストする場合に備えて、`fetch` にアクセスすることができます。

この関数の仕事は、レスポンスを表す `{ status, headers, body }` オブジェクトを返すことです。`status` は [HTTPステータスコード](https://httpstatusdogs.com)です。

- `2xx` — 成功レスポンス (デフォルトは `200`)
- `3xx` — リダイレクション (`location` ヘッダーが必要です)
- `4xx` — クライアントエラー
- `5xx` — サーバーエラー

もし返された `body` がオブジェクトで、かつ `content-type` ヘッダーが無い場合は、自動的に JSON レスポンスとなります。(`$lib` については心配無用です、[後ほど](#modules-$lib) 説明します)

> `{fallthrough: true}` が返された場合、SvelteKit は何か応答する他のルートに [フォールスルー](#routing-advanced-fallthrough-routes) し続けるか、一般的な 404 で応答します。

例えば POST のような HTTP メソッドを処理するエンドポイントは、これに相当する関数をエクスポートします。

```js
export function post(event) {...}
```

`delete` は JavaScript の予約語であるため、DELETE リクエストは`del` 関数によって処理されます。

> Node の `http` モジュールや Express などのフレームワークでおなじみの `req`/`res` オブジェクトは、特定のプラットフォームでしか利用できないため使用しません。代わりに、SvelteKitでは返却されるオブジェクトを、アプリがデプロイされるプラットフォームで要求されるものに変換します。

複数のクッキーを1つのレスポンスヘッダーにセットする場合は、配列で返します。

```js
return {
	headers: {
		'set-cookie': [cookie1, cookie2]
	}
};
```

#### Body parsing

`request` オブジェクトは標準の [Request](https://developer.mozilla.org/ja/docs/Web/API/Request) クラスのインスタンスです。そのため、request の body にアクセスするのは簡単です:

```js
export async function post({ request }) {
	const data = await request.formData(); // or .json(), or .text(), etc
}
```

#### HTTP Method Overrides

HTML `<form>` 要素は、ネイティブでは `GET` と `POST` メソッドのみをサポートしています。例えば `PUT` や `DELETE` などのその他のメソッドを許可するには、それを [configuration](#configuration-methodoverride) で指定し、`_method=VERB` パラメーター (パラメーター名は設定で変更できます) を form の `action` に追加してください:

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

### Private modules

`src/routes/foo/_Private.svelte` や `src/routes/bar/_utils/cool-util.js` のように、先頭にアンダースコアが付くファイル名はルーターから隠されますが、そうではないファイルからインポートすることは可能です。

### Advanced

#### Rest parameters

例えば `src/routes/[category]/[item].svelte` や `src/routes/[category]-[item].svelte` のように、ルート(route)は動的なパラメータを複数持つことができます。ルートセグメント(route segments)の数が不明な場合は、rest 構文を使用することができます。例えば、GitHubのファイルビューアは次のように実装することができます…

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

…`/foo-xyz` にアクセスすると、SvelteKit は最初に `foo-[bar].svelte` を試行します、なぜならベストマッチだからです。その後レスポンスがなければ、SvelteKit は `/foo-xyz` に有効にマッチする他のルートを試行します。エンドポイントはページより優先順位が高いため、次に試行されるのは `[baz].js` です。次にアルファベット順で優先順位が決まるので、`[baz].svelte` は `[qux].svelte` より先に試行されます。最初に応答するルート(route) — [`load`](#loading) から何かを返すページ、`load` 関数を持たないページ、または何かを返すエンドポイント — がリクエストを処理します。

どのページやエンドポイントもリクエストに応答しない場合、SvelteKitは一般的な404で応答します。
