---
title: Page options
---

デフォルトでは、SvelteKitはまずサーバーでコンポーネントをレンダリングし、それをHTMLとしてクライアントに送信します。それからブラウザ上でコンポーネントをサイドレンダリングし、**ハイドレーション(hydration)** と呼ばれるプロセスでそれをインタラクティブにします。そのため、コンポーネントをサーバーとブラウザのどちらでも実行できるようにしておく必要があります。その後で、SvelteKit は後続のナビゲーションを引き継ぐ [**ルーター**](/docs/routing) を初期化します。

You can control each of these on a per-app (via `svelte.config.js`) or per-page (via `+page.js` or `+page.server.js`) basis. If both are specified, per-page settings override per-app settings in case of conflicts.

### router

SvelteKit には [クライアントサイドルーター(client-side router)](/docs/appendix#routing) があり、(ユーザーがリンクをクリックしたり、戻る/進むボタンを操作したときの)ナビゲーションをインターセプトし、リロードによるブラウザのナビゲーション処理をさせることなく、ページコンテンツを更新したりします。

特定の状況においては、アプリ全体では [`browser.router` コンフィグオプション](/docs/configuration#browser)、もしくはページレベルでは `router` の export によって、[クライアントサイドルーティング(client-side routing)](/docs/appendix#routing) を無効にする必要があるかもしれません。

```js
/// file: +page.js/+page.server.js
export const router = false;
```

これによって、ルーターがすでにアクティブかどうかに関わらず、このページからのナビゲーションについてクライアントサイドルーティングが無効になることに注意してください。

### hydrate

通常、SvelteKit はサーバーでレンダリングされたHTMLをインタラクティブなページに [ハイドレート(hydrates)](/docs/appendix#hydration) します。JavaScriptを全く必要としないページ — 多くのブログ記事や 'about' ページがこのカテゴリに入りますが、これらの場合、アプリ全体では [`browser.hydrate` コンフィグオプション](/docs/configuration#browser)、ページレベルでは `hydrate` を export することにより、アプリ起動時のハイドレーションをスキップすることができます:

```js
/// file: +page.js/+page.server.js
export const hydrate = false;
```

> もし `hydrate` と `router` の両方を `false` にした場合、SvelteKit はそのページにJavaScriptを一切追加しません。もし [サーバーサイドレンダリング](/docs/hooks#handle) が `handle` で無効になっている場合、`hydrate` が `true` でないとコンテンツがレンダリングされません。

### prerender

アプリの中のいくつかのページは、ビルド時にシンプルなHTMLとして生成できるかもしれません。それらのページは [_プリレンダリング_](/docs/appendix#prerendering) することができます。

`prerender` アノテーションがあるページは自動的にプリレンダリングされます:

```js
/// file: +page.js/+page.server.js
export const prerender = true;
```

あるいは、[`config.kit.prerender.default`](/docs/configuration#prerender) を `true` にした場合、明示的に _プリレンダリング可能ではない_ とマークしているページを除いて全てプリレンダリングされます:

```js
/// file: +page.js/+page.server.js
export const prerender = false;
```

> もしアプリ全体がプリレンダリングに適しているなら、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用して、静的な web サーバーで扱うのに適した出力ファイルにすることができます。

プリレンダラーはアプリのルート(root)から始め、プリレンダリング可能なページを見つけるとHTMLを生成します。それぞれのページは、プリレンダリングの候補となる他のページを指す `<a>` 要素を見つけるためにスキャンされます — このため、通常はどのページにアクセスするか指定する必要はありません。もしプリレンダラーによってアクセスされるべきページを指定する必要があれば、[prerender configuration](/docs/configuration#prerender) の `entries` オプションでそれを行えます。

#### プリレンダリングしない場合

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

Note that you can still prerender pages that load data based on the page's parameters, such as a `src/routes/blog/[slug]/+page.svelte` route.

Accessing [`url.searchParams`](/docs/load#input-url) during prerendering is forbidden. If you need to use it, ensure you are only doing so in the browser (for example in `onMount`).

#### ルートの衝突(Route conflicts)

Because prerendering writes to the filesystem, it isn't possible to have two endpoints that would cause a directory and a file to have the same name. For example, `src/routes/foo/+server.js` and `src/routes/foo/bar/+server.js` would try to create `foo` and `foo/bar`, which is impossible.

For that reason among others, it's recommended that you always include a file extension — `src/routes/foo.json/+server.js` and `src/routes/foo/bar.json/+server.js` would result in `foo.json` and `foo/bar.json` files living harmoniously side-by-side.

_ページ_ では、`foo` の代わりに `foo/index.html` と書き込むことでこの問題を回避しています。
