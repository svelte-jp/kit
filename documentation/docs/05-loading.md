---
title: Loading
---

ページやレイアウトを定義するコンポーネントは、コンポーネントが作成される前に実行される `load` 関数をエクスポートすることができます。この関数はサーバーサイドレンダリングとクライアントの両方で実行され、ページがレンダリングされる前にデータを取得して操作することができるので、ローディングスピナーを防止することができます。

もしページのデータがエンドポイント(endpoint)から取得されるのであれば、`load` 関数は不要かもしれません。これは、もっと柔軟性が必要なとき、例えば外部の API からデータをロードする場合などに便利で、例えばこのように使います。

```html
/// file: src/routes/blog/[slug].svelte
<script context="module">
	/** @type {import('./__types/[slug]').Load} */
	export async function load({ params, fetch, session, stuff }) {
		const url = `https://cms.example.com/article/${params.slug}.json`;
		const response = await fetch(url);

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

[エンドポイント(endpoints)](/docs/routing#endpoints) と同様、ページでは [generated types](/docs/types#generated-types) をインポートできます。上記の例の `./[slug]` のように、`params` を正確に型付けすることができます。

`load` は Next.js の `getStaticProps` や `getServerSideProps` に似ていますが、違いとしては、`load` はサーバーとクライアントの両方で動作します。上記の例では、もしユーザーがこのページへのリンクをクリックした場合、自身のサーバーを経由せずに `cms.example.com` からデータを取得します。

SvelteKitの `load` は、以下のような特別なプロパティを持つ `fetch` の実装を受け取ります。

- サーバー上の cookie にアクセスできます
- HTTPコールを発行することなく、アプリ自身のエンドポイントに対してリクエストを行うことができます
- 使用時にレスポンスのコピーを作成し、ハイドレーション(hydration)のために最初のページロードに埋め込んで送信します

`load` は [ページ](/docs/routing#pages)、[レイアウト](/docs/layouts)コンポーネントにのみ適用され (インポートされるコンポーネントには適用できません)、デフォルトのレンダリング設定ではサーバーとクライアントの両方で実行されます。

> `load` ブロックの中で呼び出されるコードについて:
>
> - ネイティブの `fetch` ではなく Sveltekitが提供する [`fetch`](/docs/loading#input-fetch) ラッパーを使用する必要があります
> - `window` や `document` などの、ブラウザ固有のオブジェクトを参照してはいけません
> - クライアントに公開されるAPIキーやシークレットを直接参照するのではなく、必要なシークレットを使用するエンドポイントを呼び出す必要があります。

リクエスト毎の状態をグローバル変数に保存しないでください。キャッシュやデータベースコネクションの保持など、横断的な関心事にのみ使用することを推奨します。

> サーバー上の共有状態を変更すると、現在のクライアントだけでなく全てのクライアントに影響します。

### Input

`load` 関数は、`url`、`params`、`props`、`fetch`、`session`、`stuff`、`status`、`error` の8つのフィールドを持つオブジェクトを受け取ります。`load` 関数はリアクティブなので、関数内でそれらのパラメータが使われている場合は、そのパラメータが変更されると再実行されます。具体的には、`url`、`session`、`stuff` が関数で使用されている場合、それらの値が変更されると再実行されます。`params`の個別のプロパティも同様です。

> 関数の宣言の中でパラメータを分割しているだけで、使用されていると見なされるのでご注意ください。

#### url

`url` は [`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) のインスタンスで、`origin`、`hostname`、`pathname`、`searchParams` (これは [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) オブジェクトとしてパースされたクエリ文字列を含んでいます) といったプロパティを持っています。`url.hash` cannot be accessed during `load`, since it is unavailable on the server.

> 環境によっては、サーバーサイドレンダリングのときにこれがリクエストヘッダーから導き出される場合もあります。例えば、[adapter-node](/docs/adapters#supported-environments-node-js) を使用している場合、URL を正確にするために adapter-node に設定が必要かもしれません。

#### params

`params` は `url.pathname` とルート(route)のファイル名から得られます。

ルート(route)ファイル名が `src/routes/a/[b]/[...c]` で、`url.pathname` が `/a/x/y/z` となるような場合は、`params` オブジェクトは以下のようになります。

```json
{
	"b": "x",
	"c": "y/z"
}
```

#### props

もし読み込むページにエンドポイントがある場合、そこから返されるデータはリーフコンポーネント(leaf component)の `load` 関数内で `props` としてアクセスすることができます。エンドポイントがないレイアウトコンポーネントやページでは、`props` は空のオブジェクトとなります。

#### fetch

`fetch` は [ネイティブの `fetch` web API](https://developer.mozilla.org/ja/docs/Web/API/fetch) と同等ですが、いくつか追加の機能があります。

- ページリクエストの `cookie` と `authorization` ヘッダーを継承するので、サーバー上でクレデンシャル付きのリクエストを行うことができます
- サーバー上で、相対パスのリクエストを行うことができます (通常、`fetch` はサーバーのコンテキストで使用する場合にはオリジン付きの URL が必要です)
- サーバーサイドレンダリング中のエンドポイント(endpoints)へのリクエストは直接ハンドラ関数を実行するので、HTTPを呼び出すオーバーヘッドがありません
- サーバーサイドレンダリング中は、レスポンスはキャプチャされ、レンダリング済の HTML にインライン化されます
- ハイドレーション中は、レスポンスは HTML から読み込まれ、一貫性が保証され、追加のネットワークリクエストを防ぎます

> Cookie は、ターゲットホストが Sveltekit アプリケーションと同じか、より特定のサブドメインである場合にのみ引き渡されます。

#### session

`session` は現在のリクエストに関連するサーバーからのデータ(例えば現在のユーザー情報)の受け渡しに使用することができます。デフォルトでは `undefined` です。使い方を学ぶには [`getSession`](/docs/hooks#getsession) をご参照ください。

#### stuff

`stuff` は、レイアウトからその子孫のレイアウトとページに渡されるもので、使いたいものを埋め込むことができます。ルート(root)の `__layout.svelte` コンポーネントでは `{}` と同じですが、そのコンポーネントの `load` 関数が `stuff` プロパティを持つオブジェクトを返す場合、それ以降の `load` 関数でそれが利用できるようになります。

#### status

`status` は、エラーページのレンダリング中は HTTP のステータスコードとなり、それ以外の場合は `null` となります。

#### error

`error` は、エラーページのレンダリング中は、スローされた (または直前の `load` から返された) エラーとなり、それ以外の場合には `null` となります。 

### Output

`load` から Promise を返す場合、SvelteKit はその Promise が解決するまでレンダリングを遅らせます。戻り値には以下のいくつかのプロパティが含まれており、いずれもオプションです (戻り値自身と同様)。

> `status`、`error`、`redirect`、`cache` は、エラーページをレンダリングする際には無視されます。

#### status

ページの HTTPステータスコードです。`error` を返す場合は `4xx` か `5xx` のレスポンスでなければなりません。`redirect` を返す場合は `3xx` のレスポンスでなければなりません。デフォルトは `200` です。

#### error

`load` で何か問題が発生した場合、`Error` オブジェクトか、`4xx` または `5xx` といったステータスコードとともにエラーを説明する `string` を返しましょう。

#### redirect

(ページが非推奨であるとか、もしくはログインが必要であるなどの理由で) ページがリダイレクトされるべきなら、`3xx` のステータスコードとともにリダイレクト先となる location を含む `string` を返しましょう。

`redirect` 文字列は [適切にエンコードされた](https://developer.mozilla.org/ja/docs/Glossary/percent-encoding) URI である必要があります。絶対 URI と 相対 URI の両方が許容されます。

#### cache

```json
cache: {
	"maxage": 300,
	"private": false
}
```

ページをキャッシュさせるには `cache` オブジェクトを返します。`cache` オブジェクトには、ページの最大保持期間(秒単位) を表す `number` 型の `maxage` プロパティを含めます。オプションで、`Cache-Control` ヘッダーを `private` にするか `public` にするか決める `boolean` 型の `private` プロパティも含めることができます (これにより、ブラウザ個別だけではなく CDN にキャッシュさせることができるようになります) 。

> `cache.private` が `undefined` の場合は、SvelteKit が次のヒューリスティックに従い自動でセットします: もし `load` 関数がクレデンシャルな `fetch` を行っている場合、またはページが `session` を使用している場合は、そのページは private であるとみなされます。

これはページにのみ適用され、レイアウトには適用されません。

#### props

`load` 関数が `props` オブジェクトを返す場合、そのプロパティ(props)はレンダリング時にコンポーネントに渡されます。

#### stuff

これは既存の `stuff` とマージされ、後続のレイアウトコンポーネントやページコンポーネントの `load` 関数に渡されます。

マージされた `stuff` は、`$page.stuff` のように [page store](/docs/modules#$app-stores) を使用するコンポーネントから利用可能で、ページがレイアウトに対してデータを '上向きに' 渡すためのメカニズムを提供します。

#### dependencies

ページが依存している URL を表す文字列の配列で、後から `load` を再実行させる [`invalidate`](/docs/modules#$app-navigation-invalidate) で使用することができます。カスタムの API クライアントを使用している場合は、その URL を `dependencies` に追加する必要があります。提供される `fetch` 関数で読み込まれる URL は自動的に追加されます。

URL は、読み込まれるページに対して相対 (relative) でも絶対 (absolute) でも大丈夫ですが、[エンコード](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding) されている必要があります。
