---
title: SEO
---

SEO で最も重要なのは、高品質なコンテンツを作ること、そしてそれが web 上で広くリンクされることです。しかし、ランクが高いサイトを構築するためにいくつか技術的に考慮すべきこともあります。

## Out of the box

### SSR

近年、検索エンジンはクライアントサイドの JavaScript でレンダリングされたコンテンツのインデックスを改善してきましたが、サーバーサイドレンダリングされたコンテンツのほうがより頻繁に、より確実にインデックスされます。SvelteKit はデフォルトで SSR を採用しています。[`handle`](hooks#server-hooks-handle) で無効にすることもできますが、適切な理由がない場合はそのままにしておきましょう。

> SvelteKit のレンダリングは高度な設定が可能です。必要であれば、[動的なレンダリング(dynamic rendering)](https://developers.google.com/search/docs/advanced/javascript/dynamic-rendering) を実装することも可能です。一般的には推奨されません、SSR には SEO 以外のメリットもあるからです。

### パフォーマンス <!--performance-->

[Core Web Vitals](https://web.dev/vitals/#core-web-vitals) のような指標は検索エンジンのランクに影響を与えます。Svelte と SvelteKit はオーバーヘッドが最小限であるため、ハイパフォーマンスなサイトを簡単に構築できです。Google の [PageSpeed Insights](https://pagespeed.web.dev/) や [Lighthouse](https://developers.google.com/web/tools/lighthouse) で、ご自身のサイトをテストすることができます。

### URLの正規化 <!--normalized-urls-->

SvelteKit は、末尾のスラッシュ(trailing slash)付きのパス名から、末尾のスラッシュが無いパス名にリダイレクトします ([設定](page-options#trailingslash) で逆にできます)。URLの重複は、SEOに悪影響を与えます。

## Manual setup

### &lt;title&gt; と &lt;meta&gt; <!--title-and-meta-->

全てのページで、よく練られたユニークな `<title>` と `<meta name="description">` を [`<svelte:head>`](https://svelte.jp/docs#template-syntax-svelte-head) の内側に置くべきです。説明的な title と description の書き方に関するガイダンスと、検索エンジンにとってわかりやすいコンテンツを作るためのその他の方法については、Google の [Lighthouse SEO audits](https://web.dev/lighthouse-seo/) のドキュメントで見つけることができます。

> A common pattern is to return SEO-related `data` from page [`load`](load) functions, then use it (as [`$page.data`](modules#$app-stores)) in a `<svelte:head>` in your root [layout](routing#layout).

### 構造化データ <!--structured-data-->

[構造化データ](https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data) は、検索エンジンがページのコンテンツを理解するのに役立ちます。[`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) と一緒に構造化データを使用している場合は、明示的に `ld+json` データを保持する必要があります (これは [将来変更される可能性があります](https://github.com/sveltejs/svelte-preprocess/issues/305)):

```js
/// file: svelte.config.js
// @filename: ambient.d.ts
declare module 'svelte-preprocess';

// @filename: index.js
// ---cut---
import preprocess from 'svelte-preprocess';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess({
		preserve: ['ld+json']
		// ...
	})
};

export default config;
```

### サイトマップ <!--sitemaps-->

[サイトマップ](https://developers.google.com/search/docs/advanced/sitemaps/build-sitemap) は、検索エンジンがサイト内のページの優先順位付けをするのに役立ちます、特にコンテンツの量が多い場合は。エンドポイントを使用してサイトマップを動的に作成できます:

```js
/// file: src/routes/sitemap.xml/+server.js
export async function GET() {
	return new Response(
		`
		<?xml version="1.0" encoding="UTF-8" ?>
		<urlset
			xmlns="https://www.sitemaps.org/schemas/sitemap/0.9"
			xmlns:xhtml="https://www.w3.org/1999/xhtml"
			xmlns:mobile="https://www.google.com/schemas/sitemap-mobile/1.0"
			xmlns:news="https://www.google.com/schemas/sitemap-news/0.9"
			xmlns:image="https://www.google.com/schemas/sitemap-image/1.1"
			xmlns:video="https://www.google.com/schemas/sitemap-video/1.1"
		>
			<!-- <url> elements go here -->
		</urlset>`.trim(),
		{
			headers: {
				'Content-Type': 'application/xml'
			}
		}
	);
}
```

### AMP

現代の web 開発における不幸な現実として、サイトの [Accelerated Mobile Pages (AMP)](https://amp.dev/) バージョンを作らなければならないときがある、というのがあります。SvelteKit では、[`inlineStyleThreshold`](configuration#inlinestylethreshold) オプションを設定することでこれを実現することができます…

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// since <link rel="stylesheet"> isn't
		// allowed, inline all styles
		inlineStyleThreshold: Infinity
	}
};

export default config;
```

…最上位(root)の `+layout.js`/`+layout.server.js` の `csr` を無効にします…

```js
/// file: src/routes/+layout.server.js
export const csr = false;
```

…`amp` を `app.html` に追加します

```html
<html amp>
...
```

…そして、`transformPageChunk` と、`@sveltejs/amp` からインポートできる `transform` を使用して、HTML を変換します:

```js
/// file: src/hooks.server.js
import * as amp from '@sveltejs/amp';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let buffer = '';
	return await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			buffer += html;
			if (done) return amp.transform(buffer);
		}
	});
}
```

ページを amp に変換した結果として未使用の CSS が配布されてしまうのを防ぎたければ、[`dropcss`](https://www.npmjs.com/package/dropcss) を使用すると良いでしょう:

```js
/// file: src/hooks.server.js
// @errors: 2307
import * as amp from '@sveltejs/amp';
import dropcss from 'dropcss';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	let buffer = '';

	return await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			buffer += html;

			if (done) {
				let css = '';
				const markup = amp
					.transform(buffer)
					.replace('⚡', 'amp') // dropcss can't handle this character
					.replace(/<style amp-custom([^>]*?)>([^]+?)<\/style>/, (match, attributes, contents) => {
						css = contents;
						return `<style amp-custom${attributes}></style>`;
					});

				css = dropcss({ css, html: markup }).css;
				return markup.replace('</style>', `${css}</style>`);
			}
		}
	});
}

```

> `amphtml-validator` を使用して変換された HTML を検証するのに、`handle` hook を利用するのは良いアイデアですが、非常に遅くなってしまうので、ページをプリレンダリングするときだけにしてください。
