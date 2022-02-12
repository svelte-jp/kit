---
title: Page options
---

デフォルトでは、SvelteKitはまずサーバーでコンポーネントをレンダリングし、それをHTMLとしてクライアントに送信します。それからブラウザ上でコンポーネントをサイドレンダリングし、**ハイドレーション(hydration)** と呼ばれるプロセスでそれをインタラクティブにします。そのため、コンポーネントをサーバーとブラウザのどちらでも実行できるようにしておく必要があります。その後で、SvelteKit は後続のナビゲーションを引き継ぐ [**ルーター**](/docs/routing) を初期化します。

基本的に、これらはそれぞれアプリ単位またはページ単位で制御できます。ページ単位の設定はそれぞれ [`context="module"`](https://svelte.jp/docs#component-format-script-context-module) を使用すること、[レイアウト](/docs/layouts)コンポーネントには _適用されず_ ページコンポーネントにのみ適用されることに注意してください。

もし両方とも設定されていて、その設定がコンフリクトしていた場合、アプリ単位の設定よりページ単位の設定が優先されます。

### router

SvelteKit には [クライアントサイドルーター(client-side router)](/docs/appendix#routing) があり、(ユーザーがリンクをクリックしたり、戻る/進むボタンを操作したときの)ナビゲーションをインターセプトし、リロードによるブラウザのナビゲーション処理をさせることなく、ページコンテンツを更新したりします。

特定の状況においては、アプリ全体では [`browser.router` コンフィグオプション](/docs/configuration#browser)、もしくはページレベルでは `router` の export によって、[クライアントサイドルーティング(client-side routing)](/docs/appendix#routing) を無効にする必要があるかもしれません。

```html
<script context="module">
	export const router = false;
</script>
```

これによって、ルーターがすでにアクティブかどうかに関わらず、このページからのナビゲーションについてクライアントサイドルーティングが無効になることに注意してください。

### hydrate

通常、SvelteKit はサーバーでレンダリングされたHTMLをインタラクティブなページに [ハイドレート(hydrates)](/docs/appendix#hydration) します。JavaScriptを全く必要としないページ — 多くのブログ記事や 'about' ページがこのカテゴリに入りますが、これらの場合、アプリ全体では [`browser.hydrate` コンフィグオプション](/docs/configuration#browser)、ページレベルでは `hydrate` を export することにより、アプリ起動時のハイドレーションをスキップすることができます:

```html
<script context="module">
	export const hydrate = false;
</script>
```

> もし `hydrate` と `router` の両方を `false` にした場合、SvelteKit はそのページにJavaScriptを一切追加しません。もし [サーバーサイドレンダリング](/docs/hooks#handle) が `handle` で無効になっている場合、`hydrate` が `true` でないとコンテンツがレンダリングされません。

### prerender

アプリの中のいくつかのページは、ビルド時にシンプルなHTMLとして生成できるかもしれません。それらのページは [adapter](/docs/adapters) によって [_プリレンダリング_](/docs/appendix#prerendering) することができます。

もしアプリ全体がプリレンダリングに適しているなら、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用して、全ページのHTMLファイルと、それに加えて各ページの `load` 関数からリクエストされるファイルを生成します。

多くの場合、アプリの特定のページだけプリレンダリングしたいかと思います。それらのページは以下のようにする必要があります:

```html
<script context="module">
	export const prerender = true;
</script>
```

プリレンダラーはアプリのルート(root)から始め、プリレンダリング可能なページを見つけるとHTMLを生成します。それぞれのページは、プリレンダリングの候補となる他のページを指す `<a>` 要素を見つけるためにスキャンされます — このため、通常はどのページにアクセスするか指定する必要はありません。もしプリレンダラーによってアクセスされるべきページを指定する必要があれば、[prerender configuration](/docs/configuration#prerender) の `entries` オプションでそれを行えます。

#### プリレンダリングしない場合

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

上記の `src/routes/blog/[slug].svelte` の例のような、パラメータを元にデータをロードするページもプリレンダリングができることにご注意ください。プリレンダラーは `load` 内で行われるリクエストをインターセプトするので、`src/routes/blog/[slug].json.js` から送られるデータも取り込むことができます。

プリレンダリング中に [`url.searchParams`](/docs/loading#input-url) にアクセスすることは禁止されています。もし使う必要があるなら、ブラウザの中だけで行うようにしてください(例えば、`onMount` の中で)。

#### ルートの衝突(Route conflicts)

プリレンダリングはファイルシステムに書き込むため、ディレクトリとファイルが同じ名前になるエンドポイントを2つ持つことはできません。例えば、`src/routes/foo/index.js` と `src/routes/foo/bar.js` は `foo` と  `foo/bar` を作成しようとしますが、これは不可能です。

このため(他にも理由はありますが)、常に拡張子を付けておくことを推奨します — `src/routes/foo/index.json.js` と `src/routes/foo/bar.json.js` は `foo.json` と `foo/bar.json` ファイルが並んで調和して共存できます。

_ページ_ では、`foo` の代わりに `foo/index.html` と書き込むことでこの問題を回避しています。
