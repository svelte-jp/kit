---
title: Anchor options
---

### sveltekit:prefetch

SvelteKit はコード分割によってアプリを小さなチャンク(1ルート(route)につき1つ)に分割し、高速なスタートアップタイムを実現しています。

_動的_ なルートにとって、例えば `src/routes/blog/[slug].svelte` のような例では、それでは不十分です。ブログ記事のレンダリングのためには、そのデータをフェッチする必要がありますが、`slug` が何かわかるまでそれを行うことができません。最悪の場合、サーバーからデータが戻ってくるのをブラウザが待つので遅延が発生します。

データを _プリフェッチ_ することでそれを軽減できます。リンクに `sveltekit:prefetch` 属性を追加します…

```html
<a sveltekit:prefetch href="blog/what-is-sveltekit">What is SvelteKit?</a>
```

…これによりSvelteKitは、ナビゲーションをトリガーする `click` イベントを待つのではなく、ユーザーがリンクをホバーしたり(デスクトップの場合)、タッチしたり(モバイルの場合)するとすぐに対象ページの `load` 関数を実行します。通常、これで数百ミリ秒を稼ぐことができ、この差は、遅いユーザーインタフェースと速いユーザインターフェースの差となります。

[`router`](/docs/page-options#router) 設定が `false` だとプリフェッチは動作しないのでご注意ください。

`$app/navigation` から `prefetch` をインポートしてプログラムで `prefetch` を実行することもできます。

### sveltekit:reload

By default, the SvelteKit runtime intercepts clicks on `<a>` elements and bypasses the normal browser navigation for relative (same-origin) URLs that match one of your page routes. We sometimes need to tell SvelteKit that certain links need to be handled by normal browser navigation. Examples of this might be linking to another page on your domain that's not part of your SvelteKit app or linking to an endpoint.

Adding a `sveltekit:reload` attribute to a link...

```html
<a sveltekit:reload href="path">Path</a>
```

...will cause browser to navigate via a full page reload when the link is clicked.

Links with a `rel="external"` attribute will receive the same treatment. In addition, they will be ignored during [prerendering](https://kit.svelte.dev/docs/page-options#prerender).

### sveltekit:noscroll

When navigating to internal links, SvelteKit mirrors the browser's default navigation behaviour: it will change the scroll position to 0,0 so that the user is at the very top left of the page (unless the link includes a `#hash`, in which case it will scroll to the element with a matching ID).

In certain cases, you may wish to disable this behaviour. Adding a `sveltekit:noscroll` attribute to a link...

```html
<a href="path" sveltekit:noscroll>Path</a>
```

...will prevent scrolling after the link is clicked.
