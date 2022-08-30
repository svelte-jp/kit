---
title: Anchor options
---

### data-sveltekit-prefetch

SvelteKit はコード分割によってアプリを小さなチャンク(1ルート(route)につき1つ)に分割し、高速なスタートアップタイムを実現しています。

_動的_ なルートにとって、例えば `src/routes/blog/[slug]/+page.svelte` のような例では、それでは不十分です。ブログ記事のレンダリングのためには、そのデータをフェッチする必要がありますが、`slug` が何かわかるまでこれを行えません。最悪の場合、サーバーからデータが戻ってくるのをブラウザが待つので遅延が発生します。

データを _プリフェッチ(prefetch)_ することでそれを軽減できます。リンクに `data-sveltekit-prefetch` 属性を追加します…

```html
<a data-sveltekit-prefetch href="blog/what-is-sveltekit">What is SvelteKit?</a>
```

…これによりSvelteKitは、ナビゲーションをトリガーする `click` イベントを待つのではなく、ユーザーがリンクをホバーしたり(デスクトップの場合)、タッチしたり(モバイルの場合)するとすぐに対象ページの `load` 関数を実行します。通常、これで数百ミリ秒を稼ぐことができ、この差は、遅いユーザーインターフェイスと速いユーザーインターフェイスの差となります。

[`router`](/docs/page-options#router) 設定が `false` だとプリフェッチ(prefetch)は動作しないのでご注意ください。

`$app/navigation` から `prefetch` をインポートしてプログラムで `prefetch` を実行することもできます。

### data-sveltekit-reload

デフォルトで、SvelteKit のランタイムは `<a>` 要素に対するクリックをインターセプトし、ページのルート(routes)のURLとマッチする相対(same-origin) URL の場合は通常のブラウザナビゲーションをバイパスします。時々、通常のブラウザナビゲーションで処理しなければならない特定のリンクがあることを、SvelteKit に認識させなければならないことがあります。例としては、SvelteKit アプリのページではないものの同じドメインを共有している別のページへのリンクや、エンドポイントへのリンクが挙げられます。

リンクに `data-sveltekit-reload` 属性を追加することによって…

```html
<a data-sveltekit-reload href="path">Path</a>
```

…リンクがクリックされたときに、ブラウザはフルページリロードでナビゲートするようになります。

`rel="external"` 属性があるリンクも同じように扱われます。さらに、この場合は[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)の際に無視されるようになります。

### data-sveltekit-noscroll

内部リンクにナビゲートする場合、SvelteKit はブラウザのデフォルトのナビゲーションの挙動を模して動作します。つまり、ユーザーがページの一番左上に来るようにスクロールポジションを [0,0] にします (リンクに `#hash` が含まれている場合は、そのIDにマッチする要素までにスクロールします)。

必要に応じて、この動作を無効にすることもできます。リンクに `data-sveltekit-noscroll` 属性を追加します…

```html
<a href="path" data-sveltekit-noscroll>Path</a>
```

…これにより、リンクをクリックしたあとにスクロールされるのを防ぐことができます。
