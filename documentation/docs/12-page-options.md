---
title: Page options
---

By default, SvelteKit will render (or [prerender](/docs/appendix#prerendering)) any component first on the server and send it to the client as HTML. It will then render the component again in the browser to make it interactive in a process called **hydration**. For this reason, you need to ensure that components can run in both places. SvelteKit will then initialise a [**router**](/docs/routing) that takes over subsequent navigations.

You can control each of these on a page-by-page basis by exporting options from [`+page.js`](/docs/routing#page-page-js) or [`+page.server.js`](/docs/routing#page-page-server-js), or for groups of pages using a shared [`+layout.js`](/docs/routing#layout-layout-js) or [`+layout.server.js`](/docs/routing#layout-layout-server-js). To define an option for the whole app, export it from the root layout. Child layouts and pages override values set in parent layouts, so — for example — you can enable prerendering for your entire app then disable it for pages that need to be dynamically rendered.

### prerender

It's likely that at least some routes of your app can be represented as a simple HTML file generated at build time. These routes can be [_prerendered_](/docs/appendix#prerendering).

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = true;
```

Alternatively, you can set `export const prerender = true` in your root `+layout.js` or `+layout.server.js` and prerender everything except pages that are explicitly marked as _not_ prerenderable:

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = false;
```

Routes with `prerender = true` will be excluded from manifests used for dynamic SSR, making your server (or serverless/edge functions) smaller. In some cases you might want to prerender a route but also include it in the manifest (for example, with a route like `/blog/[slug]` where you want to prerender your most recent/popular content but server-render the long tail) — for these cases, there's a third option, 'auto':

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = 'auto';
```

> If your entire app is suitable for prerendering, you can use [`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static), which will output files suitable for use with any static webserver.

The prerenderer will start at the root of your app and generate files for any prerenderable pages or `+server.js` routes it finds. Each page is scanned for `<a>` elements that point to other pages that are candidates for prerendering — because of this, you generally don't need to specify which pages should be accessed. If you _do_ need to specify which pages should be accessed by the prerenderer, you can do so with the `entries` option in the [prerender configuration](/docs/configuration#prerender).

#### Prerendering server routes

Unlike the other page options, `prerender` also applies to `+server.js` files. These files are _not_ affected from layouts, but will inherit default values from the pages that fetch data from them, if any. For example if a `+page.js` contains this `load` function...

```js
/// file: +page.js
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const res = await fetch('/my-server-route.json');
	return await res.json();
}
```

...then `src/routes/my-server-route.json/+server.js` will be treated as prerenderable if it doesn't contain its own `export const prerender = false`.

#### プリレンダリングしない場合

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

`src/routes/blog/[slug]/+page.svelte` ルート(route)のような、ページのパラメータを元にデータをロードするページもプリレンダリングができることにご注意ください。

プリレンダリング中に [`url.searchParams`](/docs/load#input-url) にアクセスすることは禁止されています。もし使う必要があるなら、ブラウザの中だけで行うようにしてください (例えば `onMount` の中で)。

#### ルートの衝突(Route conflicts)

プリレンダリングはファイルシステムに書き込むため、ディレクトリとファイルが同じ名前になるエンドポイントを2つ持つことはできません。例えば、`src/routes/foo/+server.js` と `src/routes/foo/bar/+server.js` の場合は、`foo` と `foo/bar` を作成しようとしますが、これは不可能です。

このため(他にも理由はありますが)、常に拡張子を付けておくことを推奨します — `src/routes/foo.json/+server.js` と `src/routes/foo/bar.json/+server.js` は、`foo.json` と `foo/bar.json` ファイルが並んで調和して共存できます。

For _pages_, we skirt around this problem by writing `foo/index.html` instead of `foo`.

Note that this will disable client-side routing for any navigation from this page, regardless of whether the router is already active.

### ssr

Normally, SvelteKit renders your page on the server first and sends that HTML to the client where it's hydrated. If you set `ssr` to `false`, it renders an empty 'shell' page instead. This is useful if your page is unable to be rendered on the server, but in most situations it's not recommended ([see appendix](/docs/appendix#ssr)).

```js
/// file: +page.js
export const ssr = false;
```

### csr

Ordinarily, SvelteKit [hydrates](/docs/appendix#hydration) your server-rendered HTML into an interactive client-side-rendered (CSR) page. Some pages don't require JavaScript at all — many blog posts and 'about' pages fall into this category. In these cases you can disable CSR:

```js
/// file: +page.js
export const csr = false;
```

> If both `ssr` and `csr` are `false`, nothing will be rendered!
