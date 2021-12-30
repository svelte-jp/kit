---
title: Adapters
---

あなたの SvelteKit アプリをデプロイする前に、デプロイ対象となるアプリを _adapt_ する必要があります。Adapters は作成したアプリを入力し、デプロイして出力してくれる小さなプラグインです。

デフォルト設定では、プロジェクトは`@sveltejs/adapter-auto`を使用するように設定されており、あなたの production 環境を探知し使用可能かつ適切な adapter を選択します。もしあなたのプラットフォームが（まだ）サポートされていなければ、 [custom adapter をインストールする](#adapters-installing-custom-adapters) もしくは [custom adapter を作成する](#adapters-writing-custom-adapters)必要があるかもしれません。

> 新環境サポートに関する最新情報は[adapter-auto README](https://github.com/sveltejs/kit/tree/master/packages/adapter-auto)を確認してください。

### サポート環境

SvelteKit は数多くの公式 Adapters を提供しています。

以下のプラットフォームに関しては追加の設定は不要です:

- [Cloudflare Pages](https://developers.cloudflare.com/pages/) [`adapter-cloudflare`](https://github.com/sveltejs/kit/tree/master/packages/adapter-cloudflare)経由
- [Netlify](https://netlify.com) [`adapter-netlify`](https://github.com/sveltejs/kit/tree/master/packages/adapter-netlify)経由
- [Vercel](https://vercel.com) [`adapter-vercel`](https://github.com/sveltejs/kit/tree/master/packages/adapter-vercel)経由

#### Node.js

シンプルな Node.js サーバーを作成するには、`@sveltejs/adapter-node@next`パッケージをインストールし、`svelte.config.js`を書き換えてください:

```diff
// svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from '@sveltejs/adapter-node';
```

<!-- FIXME: self-containedのうまい訳を考える-->

加えて、 [svelte-kit build](#command-line-interface-svelte-kit-build)は`build`ディレクトリの中に self-contained した Node.js アプリを生成します。 出力先ディレクトリの設定のように、adapters にオプション設定を設定することが出来ます:

```diff
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
-		adapter: adapter()
+		adapter: adapter({ out: 'my-output-directory' })
	}
};
```

#### Static sites

Most adapters will generate static HTML for any [prerenderable](#ssr-and-javascript-prerender) pages of your site. In some cases, your entire app might be prerenderable, in which case you can use `@sveltejs/adapter-static@next` to generate static HTML for _all_ your pages. A fully static site can be hosted on a wide variety of platforms, including static hosts like [GitHub Pages](https://pages.github.com/).

```diff
// svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from '@sveltejs/adapter-static';
```

You can also use `adapter-static` to generate single-page apps (SPAs) by specifying a [fallback page](https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode).

### コミュニティ提供の adapters

<!-- FIXME: your package managerのうまい訳 -->

追加で [community 提供の adapters](https://sveltesociety.dev/components#adapters)が他プラットフォーム用に提供されています。パッケージ管理マネージャーに関連 adapter をインストールした後、`svelte.config.js`を更新してください:

```diff
// svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from 'svelte-adapter-[x]';
```

### Writing custom adapters

We recommend [looking at the source for an adapter](https://github.com/sveltejs/kit/tree/master/packages) to a platform similar to yours and copying it as a starting point.

Adapters packages must implement the following API, which creates an `Adapter`:

```js
/** @param {AdapterSpecificOptions} options */
export default function (options) {
	/** @type {import('@sveltejs/kit').Adapter} */
	return {
		name: 'adapter-package-name',
		async adapt({ utils, config }) {
			// adapter implementation
		}
	};
}
```

The types for `Adapter` and its parameters are available in [types/config.d.ts](https://github.com/sveltejs/kit/blob/master/packages/kit/types/config.d.ts).

Within the `adapt` method, there are a number of things that an adapter should do:

- Clear out the build directory
- Output code that:
  - Imports `init` and `render` from `.svelte-kit/output/server/app.js`
  - Calls `init`, which configures the app
  - Listens for requests from the platform, converts them to a a [SvelteKit request](#hooks-handle), calls the `render` function to generate a [SvelteKit response](#hooks-handle) and responds with it
  - Globally shims `fetch` to work on the target platform, if necessary. SvelteKit provides a `@sveltejs/kit/install-fetch` helper for platforms that can use `node-fetch`
- Bundle the output to avoid needing to install dependencies on the target platform, if desired
- Call `utils.prerender`
- Put the user's static files and the generated JS/CSS in the correct location for the target platform

If possible, we recommend putting the adapter output under the `build/` directory with any intermediate output placed under `.svelte-kit/[adapter-name]`.

> adapter API はバージョン 1.0 のリリース前に変更される可能性があります。
