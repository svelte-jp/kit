---
title: Loading
---

ページやレイアウトを定義するコンポーネントは、コンポーネントが作成される前に実行される `load` 関数をエクスポートすることができます。この関数はサーバーサイドレンダリングとクライアントの両方で実行され、ページがレンダリングされる前にデータを取得して操作することができるので、ローディングスピナーを防止することができます。

もしページのデータがエンドポイント(endpoint)から取得されるのであれば、`load` 関数は不要かもしれません。これは、もっと柔軟性が必要なとき、例えば外部の API からデータをロードする場合などに便利です。

```ts
// Type declarations for `load` (declarations marked with
// an `export` keyword can be imported from `@sveltejs/kit`)

export interface Load<Params = Record<string, string>, Props = Record<string, any>> {
	(input: LoadInput<Params>): MaybePromise<Either<Fallthrough, LoadOutput<Props>>>;
}

export interface LoadInput<Params extends Record<string, string> = Record<string, string>> {
	url: URL;
	params: Params;
	props: Record<string, any>;
	fetch(info: RequestInfo, init?: RequestInit): Promise<Response>;
	session: App.Session;
	stuff: Partial<App.Stuff>;
}

export interface LoadOutput<Props extends Record<string, any> = Record<string, any>> {
	status?: number;
	error?: string | Error;
	redirect?: string;
	props?: Props;
	stuff?: Partial<App.Stuff>;
	maxage?: number;
}

type MaybePromise<T> = T | Promise<T>;

interface Fallthrough {
	fallthrough: true;
}
```

> `App.Session` と `App.Stuff` については [TypeScript](#typescript) セクションをご参照ください。

外部の API からデータをロードするページではこのようになるでしょう:

```html
<!-- src/routes/blog/[slug].svelte -->
<script context="module">
	/** @type {import('@sveltejs/kit').Load} */
	export async function load({ params, fetch, session, stuff }) {
		const response = await fetch(`https://cms.example.com/article/${params.slug}.json`);

		return {
			status: response.status,
			props: {
				article: response.ok && (await response.json())
			}
		};
	}
</script>
```

> `<script context="module">` であることにご注意ください。これは、コンポーネントがレンダリングされる前に `load` が実行されるのに必要なものです。コンポーネントインスタンスごとのコードは2つ目の `<script>` タグに記述する必要があります。

`load` は Next.js の `getStaticProps` や `getServerSideProps` に似ていますが、サーバーとクライアントの両方で動作する点が異なります。上記の例では、もしユーザーがこのページへのリンクをクリックした場合、データは私たちのサーバーを経由せずに `cms.example.com` から取得されます。

`load` が `{fallthrough: true}` を返す場合、SvelteKitは応答が返るまで他のルート(routes)に[フォールスルー](#routing-advanced-routing-fallthrough-routes)するか、もしくは一般的な404で応答します。

SvelteKitの `load` は、以下のような特別なプロパティを持つ `fetch` の実装を受け取ります。

- サーバー上のクッキーにアクセスできます
- HTTPコールを発行することなく、アプリ自身のエンドポイントに対してリクエストを行うことができます
- 使用時にレスポンスのコピーを作成し、ハイドレーション(hydration)のために最初のページロードに埋め込んで送信します

`load` は [ページ](#routing-pages)、[レイアウト](#layouts)コンポーネントにのみ適用され (インポートされるコンポーネントには適用できません)、デフォルトのレンダリング設定ではサーバーとクライアントの両方で実行されます。

> `load` の中で呼び出されるコードについて:
>
> - ネイティブの `fetch` ではなく Sveltekitが提供する [`fetch`](#loading-input-fetch) ラッパーを使用する必要があります
> - `window` や `document` などの、ブラウザ固有のオブジェクトを参照してはいけません
> - クライアントに公開されるAPIキーやシークレットを直接参照するのではなく、必要なシークレットを使用するエンドポイントを呼び出す必要があります。

リクエスト前の状態をグローバル変数に保存しないでください。キャッシュやデータベース接続の保持など、横断的な関心事にのみ使用することを推奨します。

> サーバー上の共有状態を変更すると、現在のクライアントだけでなく全てのクライアントに影響します。

### Input

`load` 関数は、`url`、`params`、`props`、`fetch`、`session`、`stuff` の6つのフィールドを持つオブジェクトを受け取ります。`load` 関数はリアクティブなので、関数内でそれらのパラメータが使われている場合は、そのパラメータが変更されると再実行されます。具体的には、`url`、`session`、`stuff` が関数で使用されている場合、それらの値が変更されると再実行されます。`params`の個別のプロパティも同様です。

> 関数の宣言の中でパラメータを分割しているだけで、使用されていると見なされるのでご注意ください。

#### url

`url` は [`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) のインスタンスで、`origin`、`hostname`、`pathname`、 `searchParams` といったプロパティを持っています。

> 環境によっては、サーバーサイドレンダリングのときにこれがリクエストヘッダーから取得されるので、[設定をする必要があるかもしれません](#configuration-headers)。

#### params

`params` は `url.pathname` とルート(route)のファイル名から得られます。

ルート(route)ファイル名が `src/routes/a/[b]/[...c]` で、`url.pathname` が `/a/x/y/z` となるような場合は、`params` オブジェクトは以下のようになります。

```js
{
	"b": "x",
	"c": "y/z"
}
```

#### props

If the page you're loading has an endpoint, the data returned from it is accessible inside the leaf component's `load` function as `props`. For layout components and pages without endpoints, `props` will be an empty object.

#### fetch

`fetch` はネイティブの `fetch` web API と同等であり、クレデンシャル付きのリクエストができます。クライアントとサーバーの両方のコンテキストで使用することができます。

> `fetch` がサーバーで実行される場合、その結果のレスポンスはシリアライズされ、レンダリング済のHTMLにインライン化されます。これにより、その後のクライアントサイドの `load` は、追加のネットワークリクエストなしで、同一のデータに即座にアクセスすることができます。

> クッキーは、ターゲットホストが Sveltekit アプリケーションと同じか、より特定のサブドメインである場合にのみ引き渡されます。

#### session

`session` は現在のリクエストに関連するサーバーからのデータ(例えば現在のユーザー情報)の受け渡しに使用することができます。デフォルトでは `undefined` です。使い方を学ぶには [`getSession`](#hooks-getsession) をご参照ください。

#### stuff

`stuff` は、レイアウトコンポーネントから子レイアウトコンポーネントと子ページコンポーネントに渡されるもので、使いたいものを埋め込むことができます。ルート(root)の `__layout.svelte` コンポーネントでは `{}` と同じですが、そのコンポーネントの `load` 関数が `stuff` プロパティを持つオブジェクトを帰す場合、それ以降の `load` 関数でそれが利用できるようになります。

### Output

`load` から Promise を返した場合、SvelteKit は Promise が解決するまでレンダリングを遅らせます。戻り値にはいくつかプロパティがあり、全てオプションです。

#### status

ページの HTTPステータスコードです。`error` を返す場合は `4xx` か `5xx` のレスポンスでなければなりません。`redirect` を返す場合は `3xx` のレスポンスでなければなりません。デフォルトは `200` です。

#### error

`load` で何か問題が発生した場合、`Error` オブジェクトか、`4xx` または `5xx` といったステータスコードとともにエラーを説明する `string` を返しましょう。

#### redirect

(ページが非推奨であるとか、もしくはログインが必要であるなどの理由で) ページがリダイレクトされるべきなら、`3xx` のステータスコードとともにリダイレクト先となる location を含む `string` を返しましょう。

`redirect` 文字列は [適切にエンコードされた](https://developer.mozilla.org/ja/docs/Glossary/percent-encoding) URI である必要があります。絶対 URI と 相対 URI の両方が許容されます。

#### maxage

ページをキャッシュさせるには、ページの max age を秒単位で表した `number` を返します。レンダリングページにユーザーデータが含まれる場合(`session`経由か、`load` 関数内のクレデンシャル付きの `fetch` など)、結果のキャッシュヘッダには `private` が含まれます。それ以外の場合は、CDN でキャッシュできるように `public` が含まれます。

これはページコンポーネントにのみ適用され、レイアウトコンポーネントには適用されません。

#### props

`load` 関数が `props` オブジェクトを返す場合、そのプロパティ(props)はレンダリング時にコンポーネントに渡されます。

#### stuff

これは既存の `stuff` とマージされ、後続のレイアウトコンポーネントやページコンポーネントの `load` 関数に渡されます。

マージされた `stuff` は、`$page.stuff` のように [page store](#modules-$app-stores) を使用するコンポーネントから利用可能で、ページがレイアウトに対してデータを '上向きに' 渡すためのメカニズムを提供します。
