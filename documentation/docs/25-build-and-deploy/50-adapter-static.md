---
title: Static site generation
---

SvelteKit を static site generator (SSG) として使用するには、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用します。

この adapter はサイト全体を静的なファイルのコレクションとしてプリレンダリングします。もし、一部のページのみをプリレンダリングして他のページは動的にサーバーでレンダリングしたい場合、別の adapter と [`prerender` オプション](page-options#prerender) を組み合わせて使用する必要があります。

## 使い方 <!--usage-->

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
			fallback: undefined,
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

> SvelteKit の [`trailingSlash`](page-options#trailingslash) オプションを、あなたの環境に対して適切に設定しなければなりません。もしあなたのホスト環境が、`/a` へのリクエストを受け取ったときに `/a.html` をレンダリングしない場合、`/a/index.html` を作成するために最上位のレイアウト(root layout)で `trailingSlash: 'always'` を設定する必要があります。

## ゼロコンフィグサポート <!--zero-config-support-->

ゼロコンフィグサポートがあるプラットフォームもあります (将来増える予定):

- [Vercel](https://vercel.com)

これらのプラットフォームでは、adapter のオプションを省略することで、`adapter-static` が最適な設定を提供できるようになります:

```diff
/// file: svelte.config.js
export default {
	kit: {
-		adapter: adapter({...})
+		adapter: adapter()
	}
};
```

## Options

### pages

プリレンダリングされたページを書き込むディレクトリです。デフォルトは `build` です。

### assets

静的なアセット (`static` のコンテンツと、SvelteKit が生成するクライアントサイドの JS と CSS) を書き込むディレクトリです。通常は `pages` と同じにするべきで、デフォルトでは、それがどんな値だったとしても、`pages` の値になります。しかし、まれな状況では、出力されるページとアセットを別々の場所にする必要があるかもしれません。

### fallback

[SPA モード](single-page-apps)向けにフォールバックページ(fallback page)を指定します。例えば、`index.html` や `200.html`、`404.html` などです。

### precompress

`true` の場合、brotli や gzip でファイルを事前圧縮(precompress)します。これによって `.br` ファイルや `.gz` ファイルが生成されます。

### strict

デフォルトでは `adapter-static` は、アプリの全てのページとエンドポイント (もしあれば) がプリレンダリングされているか、もしくは `fallback` オプションが設定されているかをチェックします。このチェックは、アプリの一部が最終的な出力に含まれずアクセスできない状態なのに誤って公開されてしまうのを防ぐために存在します。もし、それでも良いことがわかっている場合 (例えばあるページが条件付きでしか存在しない場合)、`strict` を `false` に設定してこのチェックをオフにすることができます。

## GitHub Pages

GitHub Pages 向けにビルドするときは、[`paths.base`](configuration#paths) をあなたのリポジトリ名に合わせて更新するようにしてください。サイトが root からではなく <https://your-username.github.io/your-repo-name> から提供されるためです。

GitHub が提供する Jekyll が、あなたのサイトを管理するのを防ぐために、空の `.nojekyll` ファイルを `static` フォルダに追加する必要があります。

GitHub Pages 向けの設定は以下のようになるでしょう:

```js
// @errors: 2307 2322
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-static';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		paths: {
			base: dev ? '' : process.env.BASE_PATH,
		}
	}
};
```

GitHub actions を使用して、サイトが変更されたときに自動で GitHub Pages にデプロイすることができます。サンプルの workflow はこちらです:

```yaml
### file: .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: 'main'

jobs:
  build_site:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      # If you're using pnpm, add this step then change the commands and cache key below to use `pnpm`
      # - name: Install pnpm
      #   uses: pnpm/action-setup@v2
      #   with:
      #     version: 8

      - name: Install Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: build
        env:
          BASE_PATH: '/your-repo-name'
        run: |
          npm run build
          touch build/.nojekyll

      - name: Upload Artifacts
        uses: actions/upload-pages-artifact@v1
        with:
          # this should match the `pages` option in your adapter-static options
          path: 'build/'

  deploy:
    needs: build_site
    runs-on: ubuntu-latest

    permissions:
      pages: write
      id-token: write

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@v1
```
