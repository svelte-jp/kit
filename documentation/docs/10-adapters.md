---
title: Adapters
---

あなたの SvelteKit アプリをデプロイする前に、デプロイ対象となるアプリを _adapt_ する必要があります。Adapters は作成したアプリを入力し、デプロイして出力してくれる小さなプラグインです。

デフォルト設定では、プロジェクトは`@sveltejs/adapter-auto`を使用するように設定されており、あなたの production 環境を探知し使用可能かつ適切な adapter を選択します。もしあなたのプラットフォームが（まだ）サポートされていなければ、 [custom adapter をインストールする](#adapters-installing-custom-adapters) もしくは [custom adapter を作成する](#adapters-writing-custom-adapters)が必要があるかもしれません。

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

加えて、 [svelte-kit build](#command-line-interface-svelte-kit-build)は`build`ディレクトリの中に 自己解決型の Node.js アプリを生成します。 出力先ディレクトリの設定のように、adapters にオプション設定を設定することが出来ます:

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

殆どの adapters はサイトの [プリレンダリング可能](#ssr-and-javascript-prerender) なページに対して静的 HTML を生成することが出来ます。場合によっては、アプリ全体がプリレンダリング可能なこともあり、その場合は`@sveltejs/adapter-static@next`を使用して _all_ ページの静的 HTMl を生成できます。完全に静的サイトは幅広いプラットフォームでホスト可能であり、その中には[GitHub Pages](https://pages.github.com/)のような静的ホスティングも含みます。

```diff
// svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from '@sveltejs/adapter-static';
```

また[fallback page](https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode) を定義することによって single-page apps (SPAs)の生成に必要な`adapter-static`を使用することも出来ます。

### コミュニティ提供の adapters

追加で [community 提供の adapters](https://sveltesociety.dev/components#adapters)が他プラットフォーム用に提供されています。パッケージ管理システムに関連 adapter をインストールした後、`svelte.config.js`を更新してください:

```diff
// svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from 'svelte-adapter-[x]';
```

### カスタム adapters の作成

[looking at the source for an adapter](https://github.com/sveltejs/kit/tree/master/packages)をあなたのプラットフォームと似たようなものにし、それを出発点としてコピーすることを推奨します。

Adapters パッケージは必ず次の`Adapter`を作成する API を実行する必要があります:

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

`Adapter`の型定義とそのパラメータは[types/config.d.ts](https://github.com/sveltejs/kit/blob/master/packages/kit/types/config.d.ts)で使用可能です。

`adapt`メソッド内では、adapter ですべきことをたくさん定義できます:

- build ディレクトリの掃除
- コードの出力:
  - `.svelte-kit/output/server/app.js`から`init` and `render`をインポート
  - アプリを設定する`init`をコールする
  - プラットフォームからのリクエストを呼び、[SvelteKit request](#hooks-handle)に変換し、`render`関数を呼び出して[SvelteKit response](#hooks-handle) を生成し、応答する。
  - 必要であれば、対象プラットフォームで動作するように `fetch` をグローバルにシムします。SvelteKit は `node-fetch` を使用できるプラットフォーム向けに `@sveltejs/kit/install-fetch` ヘルパーを提供します
- もし実行したいなら、ターゲットプラットフォームに依存ライブラリをインストールするのを避けるために出力ファイルをバンドルする
- `utils.prerender`を呼ぶ
- 対象プラットフォームの正しい場所にユーザーの静的ファイルや生成した JS/CSS ファイルを設置する

可能であれば、`build/ `ディレクトリ配下に` .svelte-kit/[adapter-name]`という名前の中間ディレクトリを設置し、そこに adapter を出力することを推奨します。

> adapter API はバージョン 1.0 のリリース前に変更される可能性があります。
