---
title: Loading data
---

[`+page.svelte`](routing#page-page-svelte) コンポーネント (と [`+layout.svelte`](routing#layout-layout-svelte) コンポーネント) をレンダリングする前に、データを取得する必要があるケースが多いでしょう。`load` 関数を定義することでこれができるようになります。

## Page data

`+page.svelte` ファイルは、`load` 関数をエクスポートする `+page.js` という兄弟ファイルを持つことができ、`load` 関数の戻り値は page で `data` プロパティを介して使用することができます。

```js
/// file: src/routes/blog/[slug]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ params }) {
	return {
		post: {
			title: `Title for ${params.slug} goes here`,
			content: `Content for ${params.slug} goes here`
		}
	};
}
```

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>
```

生成される `$types` モジュールのおかげで、完全な型安全性を確保できます。

`+page.js` ファイルの `load` 関数はサーバーでもブラウザでも実行されます (ただし、`export const ssr = false` を設定した場合は[ブラウザでのみ実行されます](https://kit.svelte.jp/docs/page-options#ssr))。`load` 関数を*常に*サーバーで実行させたければ (例えばプライベートな環境変数を使用していたり、データベースにアクセスする場合など)、代わりに `+page.server.js` に `load` 関数を置くとよいでしょう。

例えばブログ記事の `load` 関数をより現実的なものにするとしたら、以下のように、サーバー上でのみ実行され、データベースからデータを取得する、というものになるでしょう。

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string }>
}

// @filename: index.js
// ---cut---
import * as db from '$lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		post: await db.getPost(params.slug)
	};
}
```

型が `PageLoad` から `PageServerLoad` に変わっていることにご注意ください。server `load` 関数では追加の引数にアクセスすることができます。どのような場合に `+page.js` を使用し、どのような場合に `+page.server.js` を使用するのかを理解するには、[Universal vs server](load#universal-vs-server) を参照してください。

## Layout data

`+layout.svelte` ファイルでも、`+layout.js` や `+layout.server.js` を通じてデータを読み込むことができます。

```js
/// file: src/routes/blog/[slug]/+layout.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getPostSummaries(): Promise<Array<{ title: string, slug: string }>>
}

// @filename: index.js
// ---cut---
import * as db from '$lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	return {
		posts: await db.getPostSummaries()
	};
}
```

```svelte
<!--- file: src/routes/blog/[slug]/+layout.svelte --->
<script>
	/** @type {import('./$types').LayoutData} */
	export let data;
</script>

<main>
	<!-- +page.svelte is rendered in this <slot> -->
	<slot />
</main>

<aside>
	<h2>More posts</h2>
	<ul>
		{#each data.posts as post}
			<li>
				<a href="/blog/{post.slug}">
					{post.title}
				</a>
			</li>
		{/each}
	</ul>
</aside>
```

レイアウトの `load` 関数から返されたデータは、子の `+layout.svelte` コンポーネントやそのレイアウトに属する `+page.svelte` コンポーネントでも利用可能です。

```diff
/// file: src/routes/blog/[slug]/+page.svelte
<script>
+	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

+	// we can access `data.posts` because it's returned from
+	// the parent layout `load` function
+	$: index = data.posts.findIndex(post => post.slug === $page.params.slug);
+	$: next = data.posts[index - 1];
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

+{#if next}
+	<p>Next post: <a href="/blog/{next.slug}">{next.title}</a></p>
+{/if}
```

> 複数の `load` 関数が同じキーを持つデータを返した場合、最後に返したものが'勝ちます'。レイアウトの `load` が `{ a: 1, b: 2 }` を返し、ページの `load` が `{ b: 3, c: 4 }` を返すと、結果は `{ a: 1, b: 3, c: 4 }` となります。

## $page.data

`+page.svelte` コンポーネントとその上の各 `+layout.svelte` コンポーネントは、自身のデータとその親の全てのデータにアクセスすることができます。

場合によっては、その逆も必要かもしれません — 親レイアウトからページのデータや子レイアウトのデータにアクセスする必要があるかもしれません。例えば、最上位のレイアウト(root layout)から、`+page.js` や `+page.server.js` の `load` 関数から返された `title` プロパティにアクセスしたい場合があるでしょう。これは `$page.data` で行うことができます:

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.data.title}</title>
</svelte:head>
```

`$page.data` の型情報は `App.PageData` から提供されます。

## Universal vs server

これまで見てきたように、`load` 関数には2つの種類があります:

* `+page.js` ファイルと `+layout.js` ファイルは、サーバーとブラウザの両方で実行される universal `load` 関数をエクスポートします
* `+page.server.js` ファイルと `+layout.server.js` ファイルは、サーバーサイドでのみ実行される server `load` 関数をエクスポートします

概念上は同じものですが、気をつけなければならない重要な違いがあります。

### いつ、どの load 関数が実行されるのか？ <!--when-does-which-load-function-run-->

server `load` 関数は _常に_ サーバーで実行されます。

デフォルトでは、universal `load` 関数は、ユーザーがはじめてページにアクセスしたときの SSR 中にサーバーで実行されます。そのあとのハイドレーション中に、[fetch リクエスト](#making-fetch-requests) で取得したレスポンスを再利用してもう一度実行されます。それ以降の universal `load` 関数の呼び出しは、すべてブラウザで行われます。この動作は [page options](page-options) によってカスタマイズすることができます。[サーバーサイドレンダリング](page-options#ssr) を無効にした場合、SPA となるため、universal `load` 関数は _常に_ クライアントで実行されるようになります。

ルート(route)に universal と server の両方の `load` 関数が含まれている場合、server `load` が最初に実谷されます。

`load` 関数は実行時に呼び出されます。ページを [プリレンダリング](page-options#prerender) する場合は、ビルド時に呼び出されます。

### Input

universal `load` 関数と server `load` 関数はどちらも、リクエストを表すプロパティ (`params`、`route`、`url`) と様々な関数 (`fetch`、`setHeaders`、`parent`、`depends`、`untrack`) にアクセスできます。これらについては、以下のセクションで説明します。

server `load` 関数は `ServerLoadEvent` を引数にとって呼び出されます。`ServerLoadEvent` は、`RequestEvent` から `clientAddress`、`cookies`、`locals`、`platform`、`request` を継承しています。

universal `load` 関数は、`LoadEvent` を引数にとって呼び出されます。`LoadEvent` は `data` プロパティを持っています。もし `+page.js` と `+page.server.js` (または `+layout.js` と `+layout.server.js`) の両方に `load` 関数がある場合、server `load` 関数の戻り値が、universal `load` 関数の引数の `data` プロパティとなります。

### Output

universal `load` 関数は、任意の値(カスタムクラスやコンポーネントコンストラクタなどを含む)を含むオブジェクトを返すことができます。

server `load` 関数は、ネットワークで転送できるようにするために、[devalue](https://github.com/rich-harris/devalue) でシリアライズできるデータ (つまり JSON で表現できるものに加え、`BigInt`、`Date`、`Map`、`Set`、`RegExp` や、繰り返し/循環参照など) を返さなければなりません。データには [promises](#streaming-with-promises) を含めることができ、その場合はブラウザにストリーミングされます。

### どちらを使用すべきか <!--when-to-use-which-->

server `load` 関数は、データベースやファイルシステムからデータを直接アクセスする必要がある場合や、プライベートな環境変数を使用する必要がある場合に有用です。

universal `load` 関数は、外部の API から データを `fetch` (取得) する必要があり、プライベートなクレデンシャルが必要ない場合に便利です。なぜなら、SvelteKit はあなたのサーバーを経由せずに、その API から直接データを取得することができるからです。また、Svelte コンポーネントコンストラクタのような、シリアライズできないものを返す必要がある場合にも便利です。

まれに、両方を同時に使用する必要がある場合もあります。例えば、サーバーからのデータで初期化されたカスタムクラスのインスタンスを返す必要がある場合です。両方を使用する場合は、server `load` の戻り値は直接ページには渡されず、universal `load` 関数に (`data` プロパティとして) 渡されます:

```js
/// file: src/routes/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return {
		serverMessage: 'hello from server load function'
	};
}
```

```js
/// file: src/routes/+page.js
// @errors: 18047
/** @type {import('./$types').PageLoad} */
export async function load({ data }) {
	return {
		serverMessage: data.serverMessage,
		universalMessage: 'hello from universal load function'
	};
}
```

## URL data を使用する <!--using-url-data-->

多くの場合、`load` 関数は何らかの形で URL に依存します。そのため、`load` 関数では `url`、`route`、`params` を提供しています。

### url

[`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) のインスタンスで、`origin`、`hostname`、`pathname`、`searchParams` ([`URLSearchParams`](https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams) オブジェクトとしてパースされたクエリ文字列を含む) を含んでいます。`url.hash` はサーバーで利用できないため、`load` 中にアクセスすることはできません。

> 環境によっては、サーバーサイドレンダリング時のリクエストヘッダからこれが導出されることもあります。例えば [adapter-node](adapter-node) では、URL を正しく設定するために adapter の設定をする必要があるかもしれません。

### route

現在のルート(route)ディレクトリの名前を含んでいます。`src/routes` との相対です:

```js
/// file: src/routes/a/[b]/[...c]/+page.js
/** @type {import('./$types').PageLoad} */
export function load({ route }) {
	console.log(route.id); // '/a/[b]/[...c]'
}
```

### params

`params` は `url.pathname` と `route.id` から導出されます。

`route.id` が `/a/[b]/[...c]` で、`url.pathname` が `/a/x/y/z` の場合、`params` オブジェクトはこのようになります:

```json
{
	"b": "x",
	"c": "y/z"
}
```

## fetch リクエストの作成 <!--making-fetch-requests-->

外部の API や `+server.js` ハンドラからデータを取得するには、提供されている `fetch` 関数を使用します。これは [ネイティブの `fetch` web API](https://developer.mozilla.org/ja/docs/Web/API/fetch) と同じように動作しますが、いくつか追加の機能があります:

- ページリクエストの `cookie` と `authorization` ヘッダーを継承するので、サーバー上でクレデンシャル付きのリクエストを行うことができます
- サーバー上で、相対パスのリクエストを行うことができます (通常、`fetch` はサーバーのコンテキストで使用する場合にはオリジン付きの URL が必要です)
- サーバーで動作している場合、内部リクエスト (例えば `+server.js` ルート(routes)に対するリクエスト) は直接ハンドラ関数を呼び出すので、HTTP を呼び出すオーバーヘッドがありません
- サーバーサイドレンダリング中は、`Response` オブジェクトの `text` メソッドと `json` メソッドと `arrayBuffer` メソッドにフックすることにより、レスポンスはキャプチャされ、レンダリング済の HTML にインライン化されます。ヘッダーは、[`filterSerializedResponseHeaders`](hooks#server-hooks-handle) で明示的に指定されない限り、シリアライズされないことにご注意ください。
- ハイドレーション中は、レスポンスは HTML から読み込まれるため、一貫性が保証され、追加のネットワークリクエストを防ぎます。もし、`load` 関数の `fetch` ではなくブラウザの `fetch` を使用しているときにブラウザコンソールに警告が出た場合は、これが理由です。

```js
/// file: src/routes/items/[id]/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const res = await fetch(`/api/items/${params.id}`);
	const item = await res.json();

	return { item };
}
```

## Cookies

server `load` 関数では [`cookies`](types#public-types-cookies) を取得したり設定したりすることができます。

```js
/// file: src/routes/+layout.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getUser(sessionid: string | undefined): Promise<{ name: string, avatar: string }>
rerunning-load-functions}

// @filename: index.js
// ---cut---
import * as db from '$lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
	const sessionid = cookies.get('sessionid');

	return {
		user: await db.getUser(sessionid)
	};
}
```

Cookie は、ターゲットホストが Sveltekit アプリケーションと同じか、より明確・詳細(specific)なサブドメインである場合にのみ、SvelteKit から提供される `fetch` 関数を介して引き渡されます。

例えば、SvelteKit が my.domain.com でサーブしている場合:
- domain.com は cookie を受け取りません
- my.domain.com は cookie を受け取ります
- api.domain.com は cookie を受け取りません
- sub.my.domain.com は cookie を受け取ります

その他の cookie は、`credentials: 'include'` がセットされているときには渡されません。なぜなら、Sveltekit はどの cookie がどのドメインに属しているかわからないからです (ブラウザはこの情報を渡さないからです)。そのため、cookie を転送するのは安全ではありません。これを回避するには、[handleFetch hook](hooks#server-hooks-handlefetch) をお使いください。

## Headers

server `load` 関数と universal `load` 関数はどちらも `setHeaders` 関数にアクセスでき、サーバー上で実行している場合、 レスポンスにヘッダーを設定できます (ブラウザで実行している場合、`setHeaders` には何の効果もありません)。これは、ページをキャッシュさせる場合に便利です、例えば:

```js
// @errors: 2322 1360
/// file: src/routes/products/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, setHeaders }) {
	const url = `https://cms.example.com/products.json`;
	const response = await fetch(url);

	// cache the page for the same length of time
	// as the underlying data
	setHeaders({
		age: response.headers.get('age'),
		'cache-control': response.headers.get('cache-control')
	});

	return response.json();
}
```

同じヘッダーを複数回設定することは (たとえ別々の `load` 関数であっても) エラーとなります。指定したヘッダーを設定できるのは一度だけです。`set-cookie` ヘッダーは、`setHeaders` では追加できません。代わりに、`cookies.set(name, value, options)` を使用してください。

## Using parent data

`load` 関数が親の `load` 関数からのデータにアクセスできたら便利なことがあるでしょう。`await parent()` でこれを行うことができます:

```js
/// file: src/routes/+layout.js
/** @type {import('./$types').LayoutLoad} */
export function load() {
	return { a: 1 };
}
```

```js
/// file: src/routes/abc/+layout.js
/** @type {import('./$types').LayoutLoad} */
export async function load({ parent }) {
	const { a } = await parent();
	return { b: a + 1 };
}
```

```js
/// file: src/routes/abc/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ parent }) {
	const { a, b } = await parent();
	return { c: a + b };
}
```

```svelte
<!--- file: src/routes/abc/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<!-- renders `1 + 2 = 3` -->
<p>{data.a} + {data.b} = {data.c}</p>
```

> `+page.js` の `load` 関数が、直接の親だけなく、両方のレイアウトの `load` 関数からマージされたデータを受け取っていることにご注意ください。

`+page.server.js` と `+layout.server.js` の中では、`parent` は親の `+layout.server.js` ファイルからデータを取得します。

`+page.js` や `+layout.js` では、親の `+layout.js` ファイルからデータを返します。しかし、`+layout.js` が見つからない場合は `({ data }) => data` 関数として扱われます。つまり、`+layout.js` ファイルによって'シャドウ(shadowed)'されていない親の `+layout.server.js` ファイルからデータを返します。 

`await parent()` を使用する際はウォータフォールを発生させないよう注意してください。例えば、こちらの `getData(params)` は `parent()` の呼び出しの結果には依存しないので、レンダリングの遅延を避けるために最初に呼び出すほうが良いでしょう。

```difこ
/// file: +page.js
/** @type {import('./$types').PageLoad} */
export async function load({ params, parent }) {
-	const parentData = await parent();
	const data = await getData(params);
+	const parentData = await parent();

	return {
		...data
		meta: { ...parentData.meta, ...data.meta }
	};
}
```

## Errors

`load` 中にエラーがスローされた場合、最も近くにある [`+error.svelte`](routing#error) がレンダリングされます。[想定されるエラー](/docs/errors#expected-errors)には、`@sveltejs/kit` からインポートできる `error` ヘルパーを使用して HTTP ステータスコードとオプションのメッセージを指定できます:

```js
/// file: src/routes/admin/+layout.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user?: {
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
		error(401, 'not logged in');
	}

	if (!locals.user.isAdmin) {
		error(403, 'not an admin');
	}
}
```

`error(...)` を呼び出すと例外がスローされるため、ヘルパー関数の内側から簡単に実行を止めることができます。

[予期せぬエラー](/docs/errors#unexpected-errors)がスローされた場合、SvelteKit は [`handleError`](hooks#shared-hooks-handleerror) を呼び出し、それを 500 Internal Error として処理します。

> [SvelteKit 1.x 系では](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)、ご自分で error を `throw` する必要がありました

## Redirects

ユーザーをリダイレクトさせるには、`@sveltejs/kit` からインポートできる `redirect` ヘルパーを使用して、ステータスコード `3xx` と一緒にリダイレクト先の location を指定します。`error(...)` と同じように、`redirect(...)` を呼び出すと例外がスローされるため、ヘルパー関数の内側から簡単に実行を止めることができます。

```js
/// file: src/routes/user/+layout.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user?: {
			name: string;
		}
	}
}

// @filename: index.js
// ---cut---
import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	if (!locals.user) {
		redirect(307, '/login');
	}
}
```

> `try {...}` ブロックの中で `redirect()` を使用してはいけません。redirect がすぐにその catch ステートメントをトリガーしてしまうからです。

ブラウザでは、[`$app.navigation`](modules#$app-navigation) からインポートできる [`goto`](modules#$app-navigation-goto) を使うことで、`load` 関数の外側でプログラム的にナビゲーションを行うことができます。

> [SvelteKit 1.x 系では](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)、ご自分で `redirect` を `throw` する必要がありました

## Streaming with promises

server `load` を使用する場合、promise が解決されると同時にブラウザにストリームされます。これにより、遅くて重要でないデータがある場合でも、すべてのデータが利用可能になる前にページのレンダリングを開始することができます:

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare global {
	const loadPost: (slug: string) => Promise<{ title: string, content: string }>;
	const loadComments: (slug: string) => Promise<{ content: string }>;
}

export {};

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		// make sure the `await` happens at the end, otherwise we
		// can't start loading comments until we've loaded the post
		comments: loadComments(params.slug),
		post: await loadPost(params.slug)
	};
}
```

これはロード状態(loading states)のスケルトンを作成するのに便利です、例えば:

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;
</script>

<h1>{data.post.title}</h1>
<div>{@html data.post.content}</div>

{#await data.comments}
	Loading comments...
{:then comments}
	{#each comments as comment}
		<p>{comment.content}</p>
	{/each}
{:catch error}
	<p>error loading comments: {error.message}</p>
{/await}
```

データをストリーミングする場合は、promise の reject を正しく処理するようにしてください。具体的には、レンダリングの開始時点 (本来この時点で catch される) より前に遅延ロード (lazy-loaded) された promise が失敗し、エラーを処理していない場合、server が "unhandled promise rejection" エラーでクラッシュする可能性があります。SvelteKit の `fetch` を `load` 関数で直接使用する場合は SvelteKit がこのケースを処理してくれます。それ以外の promise の場合は、何もしない `catch` (noop-`catch`) をアタッチし、処理済であることを明示するだけで十分です。

```js
/// file: src/routes/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export function load({ fetch }) {
	const ok_manual = Promise.reject();
	ok_manual.catch(() => {});

	return {
		ok_manual,
		ok_fetch: fetch('/fetch/that/could/fail'),
		dangerous_unhandled: Promise.reject()
	};
}
```

> AWS Lambda や Firebase のような ストリーミングをサポートしないプラットフォームでは、レスポンスはバッファされます。つまり、すべての promise が解決してからでないとページがレンダリングされないということです。もしプロキシ (例えば NGINX) を使用している場合は、プロキシされたサーバーからのレスポンスをバッファしないようにしてください。

> ストリーミングデータは JavaScript が有効なときにのみ動作します。ページがサーバーでレンダリングされる場合、universal `load` 関数からは promise を返すのは避けたほうがよいでしょう、ストリーミングされないからです (代わりに、関数がブラウザで再実行されるときに promise が再作成されます)。

> レスポンスのヘッダーとステータスコードは、レスポンスがストリーミングを開始すると変更することはできなくなります。そのため、ストリームされた promise の中で `setHeaders` を呼んだりリダイレクトをスローしたりすることはできません。

> [SvelteKit 1.x 系では](migrating-to-sveltekit-2#top-level-promises-are-no-longer-awaited)、トップレベルの promise は自動的に await され、ネストした promise だけがストリーミングされていました。

## Parallel loading

ページをレンダリング (またはページにナビゲーション) するとき、SvelteKit はすべての `load` 関数を同時に実行し、リクエストのウォーターフォールを回避します。クライアントサイドナビゲーションのときは、複数の server `load` 関数の呼び出し結果が単一のレスポンスにグループ化されます。すべての `load` 関数が返されると、ページがレンダリングされます。

## load 関数の再実行 <!--rerunning-load-functions-->

SvelteKit は それぞれの `load` 関数の依存関係を追跡し、ナビゲーションの際に不必要に再実行されるのを回避します。

例えば、このような `load` 関数のペアがあるとして…

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string }>
}

// @filename: index.js
// ---cut---
import * as db from '$lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	return {
		post: await db.getPost(params.slug)
	};
}
```

```js
/// file: src/routes/blog/[slug]/+layout.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getPostSummaries(): Promise<Array<{ title: string, slug: string }>>
}

// @filename: index.js
// ---cut---
import * as db from '$lib/server/database';

/** @type {import('./$types').LayoutServerLoad} */
export async function load() {
	return {
		posts: await db.getPostSummaries()
	};
}
```

…もし、`/blog/trying-the-raw-meat-diet` から `/blog/i-regret-my-choices` に移動したら、`params.slug` が変更されているので、`+page.server.js` のほうは再実行されるでしょう。`+layout.server.js` のほうは再実行されません、なぜならデータがまだ有効だからです。言い換えると、`db.getPostSummaries()` を2回呼び出すことはないということです。

`await parent()` を呼び出している `load` 関数は、親の `load` 関数が再実行された場合に再実行されます。

依存関係の追跡は、`load` 関数から返したあとには適用されません。例えば、ネストした [promise](#streaming-with-promises) の内側で `params.x` にアクセスしている場合、`params.x` が変更されても関数の再実行は行われません (ご心配なく、誤ってこれを行っても開発中に警告が表示されます)。代わりに、`load` 関数の本体部分でパラメータにアクセスしてください。

search parameter は url の他の部分とは独立し追跡されます。例えば、`load` 関数の中で `event.url.searchParams.get("x")` にアクセスすると、`?x=1` から `?x=2` にナビゲーションするときにその `load` 関数が再実行されますが、`?x=1&y=1` から `?x=1&y=2` にナビゲーションするときには再実行されません。

### Untracking dependencies

まれに、依存関係の追跡メカニズムからなにかを除外したいケースがあります。このような場合、`untrack` 関数を使用します:

```js
/// file: src/routes/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ untrack, url }) {
	// Untrack url.pathname so that path changes don't trigger a rerun
	if (untrack(() => url.pathname === '/')) {
		return { message: 'Welcome!' };
	}
}
```

### Manual invalidation

現在のページに適用される `load` 関数は、[`invalidate(url)`](modules#$app-navigation-invalidate) を使用することで再実行させることもできます。これは `url` に依存しているすべての `load` 関数を再実行させるものです。[`invalidateAll()`](modules#$app-navigation-invalidateall) は、すべての `load` 関数を再実行させます。server load 関数の場合は、クライアントに秘情報が漏れるのを防ぐため、取得した `url` に自動的に依存することはありません。

`load` 関数が `fetch(url)` や `depends(url)` を呼び出している場合、その `load` 関数は `url` に依存しています。`url` には `[a-z]:` から始まるカスタムの識別子を指定することができることにご注意ください:

```js
/// file: src/routes/random-number/+page.js
/** @type {import('./$types').PageLoad} */
export async function load({ fetch, depends }) {
	// load reruns when `invalidate('https://api.example.com/random-number')` is called...
	const response = await fetch('https://api.example.com/random-number');

	// ...or when `invalidate('app:random')` is called
	depends('app:random');

	return {
		number: await response.json()
	};
}
```

```svelte
<!--- file: src/routes/random-number/+page.svelte --->
<script>
	import { invalidate, invalidateAll } from '$app/navigation';

	/** @type {import('./$types').PageData} */
	export let data;

	function rerunLoadFunction() {
		// any of these will cause the `load` function to rerun
		invalidate('app:random');
		invalidate('https://api.example.com/random-number');
		invalidate(url => url.href.includes('random-number'));
		invalidateAll();
	}
</script>

<p>random number: {data.number}</p>
<button on:click={rerunLoadFunction}>Update random number</button>
```

### load 関数はいつ再実行されるのか <!--when-do-load-functions-rerun-->

まとめると、`load` 関数は以下のシチュエーションで再実行されます:

- `params` のプロパティを参照していて、その値が変更された場合
- `url` のプロパティ (例えば `url.pathname` や `url.search`) を参照していて、その値が変更された場合。`request.url` のプロパティは追跡されません
- `url.searchParams.get(...)` や `url.searchParams.getAll(...)` や `url.searchParams.has(...)` を呼び出しており、その該当するパラメータが変更された場合。`url.searchParams` の他のプロパティにアクセスした場合は、`url.search` にアクセスした場合と同じ効果になる。
- `await parent()` を呼び出していて、親の `load` 関数が再実行されたとき
- [`fetch`](#making-fetch-requests) (universal load のみ) や [`depends`](types#public-types-loadevent) を介して特定の URL に対する依存を宣言していて、その URL が [`invalidate(url)`](modules#$app-navigation-invalidate) で無効(invalid)であるとマークされた場合
- [`invalidateAll()`](modules#$app-navigation-invalidateall) によって全ての有効な `load` 関数が強制的に再実行された場合

`params` と `url` は、`<a href="..">` リンクのクリックや、[`<form>` のやりとり](form-actions#get-vs-post)、[`goto`](modules#$app-navigation-goto) の呼び出し、[`redirect`](modules#sveltejs-kit-redirect) に応じて変更されます。

`load` 関数の再実行は、対応する `+layout.svelte` や `+page.svelte` 内の `data` プロパティが更新されるだけで、コンポーネントは再作成されることはありません。結果として、内部の状態は保持されます。もし、この挙動がお望みでなければ、[`afterNavigate`](modules#$app-navigation-afternavigate) コールバック内でリセットしたり、コンポーネントを [`{#key ...}`](https://svelte.jp/docs#template-syntax-key) ブロックでラップしたりしてリセットすることができます。

## 認証に対する影響 <!--implications-for-authentication-->

データ読み込みに関するいくつかの機能は、認証チェックに重要な影響があります:
- レイアウトの `load` 関数は、例えばその子ルート間のクライアントサイドナビゲーションなど、すべてのリクエストで実行されるわけではありません [(load 関数はいつ再実行されるのか)](load#rerunning-load-functions-when-do-load-functions-rerun)
- レイアウトとページの `load` 関数は、`await parent()` を呼び出していない限り同時に実行されます。もしレイアウトの `load` がスローした場合、ページの `load` 関数は実行されますが、クライアントは戻り値のデータを受け取れません。

保護されたコードの前に認証チェックが行われるようにするには、いくつかの戦略が考えられます。

データのウォータフォールを防ぎつつ、レイアウトの `load` のキャッシュを保持するには:
- [hooks](hooks) を使用し、`load` 関数が実行されるよりも前に複数のルートを保護する
- ルート固有の保護が必要な場合は `+page.server.js` の `load` 関数で直接認証ガード (auth guard) を使用する

認証ガード (auth guard) を `+layout.server.js` に置くと、全ての子ページで保護されたコードの前で `await parent()` を呼び出す必要があります。全ての子ページが `await parent()` の戻り値のデータに依存していないのであれば、他のオプションのほうがパフォーマンスが良いでしょう。

## その他の参考資料 <!--further-reading-->

- [Tutorial: Loading data](https://learn.svelte.jp/tutorial/page-data)
- [Tutorial: Errors and redirects](https://learn.svelte.jp/tutorial/error-basics)
- [Tutorial: Advanced loading](https://learn.svelte.jp/tutorial/await-parent)
