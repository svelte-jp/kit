---
title: Page options
---

デフォルトでは、SvelteKit はどのコンポーネントも最初はサーバーでレンダリング (または [プリレンダリング](glossary#prerendering)) し、それを HTML としてクライアントに送信します。その後、ブラウザ上でコンポーネントを再度レンダリングし、[**ハイドレーション(hydration)**](glossary#hydration)と呼ばれるプロセスでそれをインタラクティブなものにします。このため、コンポーネントが両方の場所で実行できることを確認する必要があります。SvelteKit はそれから [**ルーター(router)**](routing) を初期化し、その後のナビゲーションを引き継ぎます。

これらはそれぞれオプションを [`+page.js`](routing#page-page-js) や [`+page.server.js`](routing#page-page-server-js) からエクスポートすることでページごとに、または共有の [`+layout.js`](routing#layout-layout-js) や [`+layout.server.js`](routing#layout-layout-server-js) を使用してページグループごとに制御することが可能です。アプリ全体に対してオプションを定義するには、最上位のレイアウト(root layout)からそれをエクスポートします。子レイアウトとページは親レイアウトで設定された値を上書きするため、例えば、プリレンダリングをアプリ全体で有効にし、それから動的にレンダリングする必要があるページではそれを無効にすることができます。

アプリの様々な領域でこれらのオプションをうまく組み合わせることができます。例えば、マーケティングページは高速化を最大限にするためにプリレンダリングし、動的なページは SEO とアクセシビリティのためにサーバーでレンダリングし、管理者用のセクションはクライアントのみでレンダリングするようにして SPA にすることができます。このように、SvelteKit はとても万能で多くの用途にお使いいただけます。

## prerender

あなたのアプリの、少なくともいくつかのルートは、ビルド時に生成されるシンプルな HTML ファイルとして表現されることが多いでしょう。これらのルート(routes)を [_プリレンダリング_](glossary#prerendering) することができます。

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = true;
```

代わりに、`export const prerender = true` を最上位(root)の `+layout.js` または `+layout.server.js` に設定し、明示的にプリレンダリングしないものとしてマークされたページを除き、全てをプリレンダリングできます:

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = false;
```

`prerender = true` があるルート(routes)は動的な SSR を行うのに使用する manifest から除外されるため、サーバー (または serverless/edge functions) を小さくすることができます。場合によっては、ルート(route)をプリレンダリングしつつ、manifest にも含めたいことがあるでしょう (例えば、`/blog/[slug]` のようなルート(route)があり、最も新しい/人気のあるコンテンツはプリレンダリングしたいがめったにアクセスされないものはサーバーでレンダリングしたい、など)。こういったケースのために、3つ目のオプションがあります、'auto' です:

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = 'auto';
```

> もしアプリ全体がプリレンダリングに適している場合は、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使うことで、任意の静的 Web サーバーで使用するのに適したファイルを出力することができます。

プリレンダラはアプリの最上位(root)から開始され、プリレンダリング可能なページや `+server.js` ルート(routes)を見つけると、そのファイルを生成します。各ページは、プリレンダリングの候補である他のページを指し示す `<a>` 要素を見つけるためにスキャンされます。このため、通常はどのページにアクセスすべきか指定する必要はありません。もしプリレンダラがアクセスするページを指定する必要がある場合は、[`config.kit.prerender.entries`](configuration#prerender) で指定するか、動的なルート(route)から [`entries`](#entries) 関数をエクスポートします。

プリレンダリング中、[`$app/environment`](modules#$app-environment) からインポートされる `building` の値は `true` になります。

### Prerendering server routes

他のページオプションとは違い、`prerender` は `+server.js` ファイルにも適用できます。これらのファイルはレイアウトから影響を受けませんが、そこからデータを読み込むページからデフォルトの値を継承します。例えば、`+page.js` がこの `load` 関数を含む場合…

```js
/// file: +page.js
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const res = await fetch('/my-server-route.json');
	return await res.json();
}
```

…それから `src/routes/my-server-route.json/+server.js` は、自身の `export const prerender = false` を含んでいなければ、プリレンダリング可能であると扱われることになります。

### プリレンダリングしない場合 <!--when-not-to-prerender-->

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

`src/routes/blog/[slug]/+page.svelte` ルート(route)のような、ページのパラメータを元にデータをロードするページもプリレンダリングができることにご注意ください。

プリレンダリング中に [`url.searchParams`](load#using-url-data-url) にアクセスすることは禁止されています。もし使う必要があるなら、ブラウザの中だけで行うようにしてください (例えば `onMount` の中で)。

[action](form-actions) 付きのページは、サーバーがその action の `POST` リクエストを処理できなければならないため、プリレンダリングできません。

### Prerender and ssr

[ssr option](#ssr) を `false` に設定すると、各リクエストは同じ空の HTML shell になってしまいます。これは不必要な作業となるため、SvelteKit は `prerender` が明示的に `false` に設定されていないページを見つけた場合、デフォルトでプリレンダリングを行います。

### ルートの衝突(Route conflicts)

プリレンダリングはファイルシステムに書き込むため、ディレクトリとファイルが同じ名前になるエンドポイントを2つ持つことはできません。例えば、`src/routes/foo/+server.js` と `src/routes/foo/bar/+server.js` の場合は、`foo` と `foo/bar` を作成しようとしますが、これは不可能です。

このため(他にも理由はありますが)、常に拡張子を付けておくことを推奨します — `src/routes/foo.json/+server.js` と `src/routes/foo/bar.json/+server.js` は、`foo.json` と `foo/bar.json` ファイルが並んで調和して共存できます。

ページの場合は、`foo` ではなく `foo/index.html` を書き込むことでこの問題を回避しています。

### Troubleshooting

'The following routes were marked as prerenderable, but were not prerendered' というようなエラーが表示されたら、それは該当のルート (またはページの場合は親レイアウト) に `export const prerender = true` があるにもかかわらず実際にはそのページがプリレンダリングされていないことが原因です (プリレンダリングクローラーがそのページにアクセスしていないため)。

これらのルート(route)は動的にサーバーレンダリングできないため、該当のルート(route)にアクセスしようとしたときにエラーが発生します。それを解決するには、2つの方法があります:

* SvelteKit が [`config.kit.prerender.entries`](configuration#prerender) か [`entries`](#entries) ページオプションからのリンクを辿ってそのルート(route)を見つけられるようにしてください。動的なルート(例えば `[parameters]` を持つページ) へのリンクは、他のエントリーポイントをクローリングしても見つからない場合はこのオプションに追加してください。そうしないと、SvelteKit はその parameters が持つべき値がわからないので、プリレンダリングされません。プリレンダリング可能(prerenderable)なページとしてマークされていないページは無視され、そのページから他のページ(プリレンダリング可能なものも含む)へのリンクもクローリングされません。
* `export const prerender = true` から `export const prerender = 'auto'` に変更してください。`'auto'` になっているルート(route)は動的にサーバーレンダリングすることができます

## entries

SvelteKit は、 _エントリーポイント(entry points)_ を開始地点としてクローリングを行うことでページを自動的に発見します。デフォルトでは、動的でないルート(route)はすべてエントリーポイントとみなされます。例えば、以下のルートがある場合…

```bash
/             # non-dynamic
/blog         # non-dynamic
/blog/[slug]  # dynamic, because of `[slug]`
```

…SvelteKit は `/` と `/blog` をプリレンダリングし、その過程で `<a href="/blog/hello-world">` などのリンクを発見し、それをプリレンダリング対象とします。

ほとんどの場合、これで十分です。しかし状況によっては、`/blog/hello-world` などのページに対するリンクが存在しない (あるいはプリレンダリングされたページには存在しない) 場合があります。この場合、SvelteKit にその存在を知らせる必要があります。

これを行うには [`config.kit.prerender.entries`](configuration#prerender) で指定するか、動的なルート(route) に属する `+page.js` か `+page.server.js` か `+server.js` で `entries` 関数をエクスポートします:

```js
/// file: src/routes/blog/[slug]/+page.server.js
/** @type {import('./$types').EntryGenerator} */
export function entries() {
	return [
		{ slug: 'hello-world' },
		{ slug: 'another-blog-post' }
	];
}

export const prerender = true;
```

`entries` は `async` 関数にすることができるので、(例えば) 上記で示したように CMS や データベースから投稿リストを取得することもできます。

## ssr

通常、SvelteKit ではページを最初にサーバーでレンダリングし、その HTML をクライアントに送信して[ハイドレーション](glossary#hydration)を行います。もし `ssr` を `false` に設定した場合、代わりに空の 'shell' ページがレンダリングされます。これはページがサーバーでレンダリングできない場合には便利 (例えば `document` などのブラウザオンリーな globals を使用するなど) ですが、ほとんどの状況では推奨されません ([appendix をご参照ください](glossary#ssr))。

```js
/// file: +page.js
export const ssr = false;
```

`export const ssr = false` を最上位(root)の `+layout.js` に追加した場合、アプリ全体がクライアントのみでレンダリングされるようになり、それはつまり、本質的にはアプリを SPA にする、ということを意味します。

## csr

通常、SvelteKit はサーバーでレンダリングされた HTML を、クライアントサイドレンダリング(CSR)されたインタラクティブなページに [ハイドレーション](glossary#hydration) します。JavaScript を全く必要としないページもあります。多くのブログ記事や 'about' ページがこのカテゴリに入ります。このような場合は CSR を無効にすることができます:

```js
/// file: +page.js
export const csr = false;
```

> `ssr` to `csr` の両方が `false` である場合は、何もレンダリングされません！

## trailingSlash

デフォルトでは、SvelteKit は URL から末尾のスラッシュ(trailing slash)を取り除きます。`/about/` にアクセスすると、`/about` へのリダイレクトをレスポンスとして受け取ることになります。この動作は、`trailingSlash` オプションで変更することができます。指定できる値は `'never'` (デフォルト)、`'always'`、`'ignore'` です。

他のページオプションと同様に、`+layout.js` や `+layout.server.js` からこの値をエクスポートすると、すべての子のページに適用されます。`+server.js` ファイルからその設定をエクスポートすることもできます。

```js
/// file: src/routes/+layout.js
export const trailingSlash = 'always';
```

このオプションは [プリレンダリング](#prerender) にも影響します。`trailingSlash` が `always` の場合 `/about` というルート(route)は `about/index.html` ファイルとなり、それ以外の場合は `about.html` が作成され、静的な Web サーバの慣習を反映したものになります。

> 末尾のスラッシュを無視することは推奨されません。相対パスのセマンティクスが2つのケースで異なり(`/x` からの `./y` は `/y` ですが、`/x/` からは `/x/y` となります)、`/x` と `/x/` は別の URL として扱われ、SEO 上有害となるからです。

## config

[adapter](adapters) のコンセプトにより、SvelteKit は様々なプラットフォーム上で実行することができます。しかし、各プラットフォームには、デプロイメントをさらに微調整するための特定の設定があるかもしれません — 例えば Vercel では、アプリのある部分はエッジに、他の部分はサーバーレス環境にデプロイするのを選択することができます。

`config` はトップレベルで key-value ペアを持つオブジェクトです。その他の具体的な形は、使用する adapter に依存します。すべての adapter は型安全性のためにインポート可能な `Config` インターフェースを提供することになっています。詳細な情報については、使用する adapter のドキュメントを参照してください。

```js
// @filename: ambient.d.ts
declare module 'some-adapter' {
	export interface Config { runtime: string }
}

// @filename: index.js
// ---cut---
/// file: src/routes/+page.js
/** @type {import('some-adapter').Config} */
export const config = {
	runtime: 'edge'
};
```

`config` オブジェクトはトップレベル(top level)でマージされます (より深いレベル(deeper levels)ではマージされません)。つまり、より上位の `+layout.js` にある値の一部を上書きしたい場合に、`+page.js` にある全ての値を繰り返す必要はないということです。例えばこの layout の設定は…

```js
/// file: src/routes/+layout.js
export const config = {
	runtime: 'edge',
	regions: 'all',
	foo: {
		bar: true
	}
}
```

…この page の設定で上書きされ…

```js
/// file: src/routes/+page.js
export const config = {
	regions: ['us1', 'us2'],
	foo: {
		baz: true
	}
}
```

…このページの設定の値は `{ runtime: 'edge', regions: ['us1', 'us2'], foo: { baz: true } }` となります。

## その他の参考資料 <!--further-reading-->

- [Tutorial: Page options](https://learn.svelte.jp/tutorial/page-options)
