---
title: SSR and JavaScript
---

デフォルトでは、SvelteKitはまずサーバーでコンポーネントをレンダリングし、それをHTMLとしてクライアントに送信します。それからブラウザ上でコンポーネントをサイドレンダリングし、**ハイドレーション(hydration)** と呼ばれるプロセスでそれをインタラクティブにします。そのため、コンポーネントをサーバーとブラウザのどちらでも実行できるようにしておく必要があります。その後で、SvelteKit は後続のナビゲーションを引き継ぐ [**ルーター(router)**](#routing) を初期化します。

基本的に、これらはそれぞれアプリ単位またはページ単位で制御できます。ページ単位の設定はそれぞれ [`context="module"`](https://svelte.jp/docs#script_context_module) を使用すること、[レイアウト](#layouts)コンポーネントには _適用されず_ ページコンポーネントにのみ適用されることに注意してください。

アプリ単位とページ単位の両方が設定されている場合、もしコンフリクトしていたらページ単位の設定が優先されます。それぞれの設定は独立して制御することができますが、`ssr` と `hydrate` の両方を `false` にすることはできません。そうしてしまうと一切レンダリングされなくなってしまうからです。

### ssr

[サーバーサイドレンダリング(server-side rendering)](#appendix-ssr) を無効にすると、SvelteKitアプリは事実上 [**シングルページアプリ(single-page app)** または SPA](#appendix-csr-and-spa) になります。

> ほとんどの場合、これは推奨されません: [appendix のディスカッション](#appendix-ssr) をご参照ください。無効にすることが本当に適切かどうか検討し、SSRで問題にぶつかったからと言って単純にSSRを無効にしないようにしてください。

アプリ全体では [`ssr` コンフィグオプション](#configuration-ssr)、ページレベルでは `ssr` を export することでSSRを無効にすることができます:

```html
<script context="module">
	export const ssr = false;
</script>
```

### router

SvelteKit には [クライアントサイドルーター(client-side router)](#appendix-routing) があり、(ユーザーがリンクをクリックしたり、戻る/進むボタンを操作したときの)ナビゲーションをインターセプトし、リロードによるブラウザのナビゲーション処理をさせることなく、ページコンテンツを更新したりします。

特定の状況においては、アプリ全体では [`router` コンフィグオプション](#configuration-router) またはページレベルでは `router` の export によって、[クライアントサイドルーティング(client-side routing)](#appendix-routing) を無効にする必要があるかもしれません。

```html
<script context="module">
	export const router = false;
</script>
```

これによって、ルーターがすでにアクティブかどうかに関わらず、このページからのナビゲーションについてクライアントサイドルーティングが無効になることに注意してください。

### hydrate

通常、SvelteKit はサーバーでレンダリングされたHTMLをインタラクティブなページに [ハイドレート(hydrates)](#appendix-hydration) します。JavaScriptを全く必要としないページ — 多くのブログ記事や 'about' ページがこのカテゴリに入りますが、これらの場合、アプリ全体では [`hydrate` コンフィグオプション](#configuration-hydrate)、ページレベルでは `hydrate` の export により、アプリ起動時のハイドレーションをスキップすることができます:

```html
<script context="module">
	export const hydrate = false;
</script>
```

> もし `hydrate` と `router` の両方を `false` にした場合、SvelteKit はそのページにJavaScriptを一切追加しません。

### prerender

アプリの中のいくつかのページは、ビルド時にシンプルなHTMLとして生成できるかもしれません。それらのページは [アダプター(adapter)](#adapters) によって [_プリレンダリング_](#appendix-prerendering) することができます。

もしアプリ全体がプリレンダリングに適しているなら、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用して、全ページのHTMLファイルと、それに加えて各ページの `load` 関数からリクエストされるファイルを生成します。

多くの場合、アプリの特定のページだけプリレンダリングしたいかと思います。それらのページは以下のようにする必要があります:

```html
<script context="module">
	export const prerender = true;
</script>
```

プリレンダラーはアプリのルート(root)から始め、プリレンダリング可能なページを見つけるとHTMLを生成します。それぞれのページは、プリレンダリングの候補となる他のページを指す `<a>` 要素を見つけるためにスキャンされます — このため、通常はどのページにアクセスするか指定する必要はありません。もしプリレンダラーによってアクセスされるべきページを指定する必要があれば、[prerender configuration](#configuration-prerender) の `entries` オプションでそれを行えます。

#### When not to prerender(プリレンダリングすべきでない場合)

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

上記の `src/routes/blog/[slug].svelte` の例のような、パラメータを元にデータをロードするページもプリレンダリングができることにご注意ください。プリレンダラーは `load` 内で行われるリクエストをインターセプトするので、`src/routes/blog/[slug].json.js` から送られるデータも取り込むことができます。

プリレンダリング中に [`page.query`](#loading-input-page) にアクセスすることは禁止されています。もし使う必要があるなら、ブラウザの中だけで行うようにしてください(例えば、`onMount` の中で)。

#### Route conflicts

プリレンダリングはファイルシステムに書き込むため、ディレクトリとファイルが同じ名前になるエンドポイントを2つ持つことはできません。例えば、`src/routes/foo/index.js` と `src/routes/foo/bar.js` は `foo` と  `foo/bar` を作成しようとしますが、これは不可能です。

このため(他にも理由はありますが)、常に拡張子を付けておくことを推奨します — `src/routes/foo/index.json.js` と `src/routes/foo/bar.json.js` は `foo.json` と `foo/bar.json` ファイルが並んで調和して共存できます。

_ページ_ では、`foo` の代わりに `foo/index.html` と書き込むことでこの問題を回避しています。
