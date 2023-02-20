---
title: Static site generation
---

SvelteKit を static site generator (SSG) として使用するには、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用します。

この adapter はサイト全体を静的なファイルのコレクションとしてプリレンダリングします。もし、一部のページのみをプリレンダリングしたい場合、別の adapter と [`prerender` オプション](page-options#prerender) を組み合わせて使用する必要があります。

## 使い方

`npm i -D @sveltejs/adapter-static` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true
		})
	}
};
```

…そして [`prerender`](page-options#prerender) オプションを最上位のレイアウト(root layout)に追加します:

```js
/// file: src/routes/+layout.js
// This can be false if you're using a fallback (i.e. SPA mode)
export const prerender = true;
```

> SvelteKit の [`trailingSlash`](page-options#trailingslash) オプションを、あなたの環境に対して適切に設定しなければなりません。もしあなたのホスト環境が、`/a` へのリクエストを受け取ったときに `/a.html` をレンダリングしない場合、`/a/index.html` を作成するために `trailingSlash: 'always'` を設定する必要があります。

## ゼロコンフィグサポート

ゼロコンフィグサポートがあるプラットフォームもあります (将来増える予定):

- [Vercel](https://vercel.com)

これらのプラットフォームでは、adapter のオプションを省略することで、`adapter-static` が最適な設定を提供できるようになります:

```diff
/// file: svelte.config.js
export default {
	kit: {
-		adapter: adapter({...}),
+		adapter: adapter(),
		}
	}
};
```

## Options

### pages

プリレンダリングされたページを書き込むディレクトリです。デフォルトは `build` です。

### assets

静的なアセット (`static` のコンテンツと、SvelteKit が生成するクライアントサイドの JS と CSS) を書き込むディレクトリです。通常は `pages` と同じにするべきで、デフォルトでは、それがどんな値だったとしても、`pages` の値になります。しかし、まれな状況では、出力されるページとアセットを別々の場所にする必要があるかもしれません。

### fallback

SPA モードのための[フォールバックページ(fallback page)](#spa-mode-add-fallback-page)を指定します。例えば、`index.html` や `200.html`、`404.html` などです。

### precompress

`true` の場合、brotli や gzip でファイルを事前圧縮(precompress)します。これによって `.br` ファイルや `.gz` ファイルが生成されます。

### strict

デフォルトでは `adapter-static` は、アプリの全てのページとエンドポイント (もしあれば) がプリレンダリングされているか、もしくは `fallback` オプションが設定されているかをチェックします。このチェックは、アプリの一部が最終的な出力に含まれずアクセスできない状態なのに誤って公開されてしまうのを防ぐために存在します。もし、それでも良いことがわかっている場合 (例えばあるページが条件付きでしか存在しない場合)、`strict` を `false` に設定してこのチェックをオフにすることができます。

## SPA モード

`adapter-static` を使用し、**フォールバックページ(fallback page)** を指定することで、シングルページアプリ(SPA)を作成することができます。

> ほとんどの場合、これはおすすめできません: SEO に悪影響を与え、知覚的なパフォーマンスが低下する傾向があり、もし JavaScript が失敗したり無効になっていたりする場合 (これは[あなたが思うより頻繁に](https://kryogenix.org/code/browser/everyonehasjs.html)発生します)、ユーザーはアプリにアクセスできなくなります.

もし、プリレンダリングされるルート(routes)がないシンプルな SPA を作成したい場合は、必要な設定はこのようになります:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			fallback: '200.html'
		}),
		prerender: { entries: [] }
	}
};
```

```js
/// file: src/routes/+layout.js
export const ssr = false;
```

SPA にしたいページのみ[プリレンダリングを無効化することで](#spa-mode-turn-off-prerendering)、アプリの一部のみを SPA にすることもできます。

これらのオプションを1つずつ見ていきましょう:

### フォールバックページ(fallback page)を追加する

フォールバックページ(fallback page)とは、SvelteKit がページテンプレート(例: `app.html`)から作成する HTML ページで、アプリをロードし正しいルート(routes)にナビゲートします。例えば、静的 web ホスティングである [Surge](https://surge.sh/help/adding-a-200-page-for-client-side-routing) では、静的なアセットやプリレンダリングページに対応しないリクエストを処理する `200.html` ファイルを追加する必要があります。このファイルはこのように作成することができます:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

export default {
	kit: {
		adapter: adapter({
			fallback: '200.html'
		})
	}
};
```

> ただし、この動作を設定する方法はあなたのホスティングソリューションに依存するので、Sveltekit の管轄外です。リクエストをリダイレクトする方法については、ホスティング環境のドキュメントを検索することをおすすめします。

### プリレンダリングをオフにする

SPA モードで動作させる場合、最上位のレイアウト(root layout)の [`prerender`](page-options#prerender) オプションを省略することができ (または、デフォルト値の `false` を設定)、`prerender` オプションが設定されているページのみ、ビルド時にプリレンダリングされます。

SvelteKit はプリレンダリング可能なページを探すためにアプリのエントリーポイントをクロールします。ブラウザから読み込めないページが原因で `svelte-kit build` が失敗する場合は、`config.kit.prerender.entries` を `[]` に設定することでこれを防ぐことができます。

アプリの一部のみプリレンダリングをオフにすることで、その他の部分をプリレンダリングすることもできます。

### ssr をオフにする

開発中、SvelteKit はあなたのルート(routes)をサーバーサイドでレンダリングしようとします。つまり、ブラウザでのみ利用可能なもの (例えば `window` オブジェクト) にアクセスすると、たとえ最終的に出力されるアプリとしては有効であっても、エラーとなります。Sveltekit の開発モードの動作を SPA に合わせるには、[`export const ssr = false`](page-options#ssr) を最上位(root) の `+layout` に追加します。このオプションをアプリの一部に追加して、その他の部分をプリレンダリングすることもできます。

### Apache

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

## GitHub Pages

GitHub Pages 向けにビルドするときは、[`paths.base`](configuration#paths) をあなたのリポジトリ名に合わせて更新するようにしてください。サイトが root からではなく <https://your-username.github.io/your-repo-name> から提供されるためです。

GitHub が提供する Jekyll が、あなたのサイトを管理するのを防ぐために、空の `.nojekyll` ファイルを `static` フォルダに追加する必要があります。

GitHub Pages 向けの設定は以下のようになるでしょう:

```js
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		paths: {
			base: dev ? '' : '/your-repo-name',
		}
	}
};
```
