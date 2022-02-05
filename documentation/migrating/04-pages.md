---
title: Pages and layouts
---

### Renamed files

カスタムエラーページコンポーネントを `_error.svelte` から `__error.svelte` にリネームしてください。同様に、`_layout.svelte` ファイルも `__layout.svelte` にリネームしてください。SvelteKitでは二重のアンダースコアの接頭辞をリザーブしています。[プライベートモジュール](#routing-private-modules)にはまだ接頭辞として `_` を付けます([`ルート(routes)`](docs#configuration-routes)設定で変更可能です)。

### Imports

`@sapper/app` からインポートしていた `goto`、`prefetch`、`prefetchRoutes` は [`$app/navigation`](/docs#modules-$app-navigation) からのインポートに置き換えてください。

`@sapper/app` からインポートしていた `stores` については置き換える必要があります — 以下の [Stores](#pages-and-layouts-stores) をご覧ください。

`src/node_modules` にあるディレクトリからインポートしてたファイルは、[`$lib`](/docs#modules-$lib) からのインポートに置き換えてください。

### Preload

従来どおり、ページやレイアウトコンポーネントは、レンダリングが行われる前にデータをロードできる関数をエクスポートすることができます。

この関数は `preload` から [`load`](/docs#loading) にリネームされ、その API が変更されました。2つの引数 — `page` と `session` — の代わりに、両方を1つにまとめた引数と、`fetch` (`this.fetch` からの置き換え)、そして新たに `stuff` オブジェクトが追加されました。

`this` オブジェクトはなくなり、その結果 `this.fetch`、`this.error`、`this.redirect` もなくなりました。プロパティ(props)を直接返す代わりに、`load` は 他の様々なものと一緒に `props` を _含む_ オブジェクトを返すようになりました。

最後に、もしページに `load` メソッドがある場合は、必ず何かを返すようにしてください。そうしないと `Not found` になります。

### Stores

Sapper では、提供されるストアをこのように参照していたかと思います:

```js
import { stores } from '@sapper/app';
const { preloading, page, session } = stores();
```

`page` と `session` ストアはまだ存在しています。`preloading` は、`from`、`to` プロパティを含む `navigating` ストアに置き換えられました。`page` は `url`、`params` を持つようになりましたが、`path` と `query` はありません。

SvelteKit では、それらにアクセスする方法が異なります。`stores` は `getStores` になりましたが、[`$app/stores`](/docs#modules-$app-stores) から直接 `navigating`、`page`、`session` をインポートできるので、ほとんどの場合は必要ありません。

### Routing

ルート(routes) の正規表現はもうサポートされていません。代わりに、[fallthrough routes](/docs#routing-advanced-routing-fallthrough-routes) をお使いください。

### URLs

Sapperでは、相対 URL は、現在のページに対してではなくベース URL  — `basepath` オプションが使用されていない限り、大抵の場合は `/` — に対して解決されていました

このため問題が発生していましたが、SvelteKit ではもうそのようなことはありません。URL は現在のページ(または `load` 関数の `fetch` URL の場合は移動先のページ) に対して解決されるようになりました。

### &lt;a&gt; attributes

- `sapper:prefetch` は現在 `sveltekit:prefetch` になりました
- `sapper:noscroll` は現在 `sveltekit:noscroll` になりました
