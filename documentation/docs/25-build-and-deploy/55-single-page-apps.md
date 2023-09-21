---
title: Single-page apps
---

SvelteKit アプリは、どんな adapter を使っていても、最上位のレイアウト(root layout)で SSR を無効にすることで、完全にクライアントレンダリングされるシングルページアプリ (SPA) にすることができます。

```js
/// file: src/routes/+layout.js
export const ssr = false;
```

> ほとんどの場合、これはおすすめできません: SEO に悪影響を与え、知覚的なパフォーマンスが低下する傾向があり、もし JavaScript が失敗したり無効になっていたりする場合 (これは[あなたが思うより頻繁に](https://kryogenix.org/code/browser/everyonehasjs.html)発生します)、ユーザーはアプリにアクセスできなくなります.

サーバーサイドのロジック (すなわち `+page.server.js`、`+layout.server.js`、`+server.js` ファイル) がない場合は、[`adapter-static`](adapter-static) を使い _フォールバックページ(fallback page)_ を追加することで SPA を作ることができます。

## 使い方 <!--usage-->

`npm i -D @sveltejs/adapter-static` でインストールし、それから `svelte.config.js` にこの adapter と以下のオプションを追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			fallback: '200.html' // may differ from host to host
		})
	}
};
```

フォールバックページ(`fallback` page)とは、SvelteKit がページテンプレート(例: `app.html`)から作成する HTML ページで、アプリをロードし正しいルート(routes)にナビゲートします。例えば、静的 web ホスティングである [Surge](https://surge.sh/help/adding-a-200-page-for-client-side-routing) では、静的なアセットやプリレンダリングページに対応しないリクエストを処理する `200.html` ファイルを追加する必要があります。

ホスティング環境によっては `index.html` であったり全く別のものであったりします — 使いたいプラットフォームのドキュメントをご参照ください。

## Apache

SPA を [Apache](https://httpd.apache.org/) で実行する場合は、`static/.htaccess` ファイルを追加し、リクエストをフォールバックページ(fallback page)にルーティングする必要があります:

```
<IfModule mod_rewrite.c>
	RewriteEngine On
	RewriteBase /
	RewriteRule ^200\.html$ - [L]
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_FILENAME} !-d
	RewriteRule . /200.html [L]
</IfModule>
```

## ページを個別にプリレンダリングする <!--prerendering-individual-pages-->

特定のページをプリレンダリングしたい場合、アプリのその部分だけ `ssr` と `prerender` を再び有効にします:

```js
/// file: src/routes/my-prerendered-page/+page.js
export const prerender = true;
export const ssr = true;
```