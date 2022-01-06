---
question: SvelteKit で X を使うにはどうすればよいですか？
---

[ドキュメントのインテグレーションのセクション](/docs#additional-resources-integrations) をしっかり読み込んでください。それでも問題が解決しない場合のために、よくある問題の解決策を以下に示します。

### データベースのセットアップはどう行えばよいですか？

データベースに問い合わせを行うコードを [エンドポイント](/docs#routing-endpoints) に置いてください - .svelte ファイルの中でデータベースに問い合わせを行わないでください。コネクションをすぐにセットアップし、シングルトンとしてアプリ全体からクライアントにアクセスできるように `db.js` のようなものを作ることができます。`hooks.js` で1回セットアップするコードを実行し、データベースヘルパーを必要とするすべてのエンドポイントにインポートできます。

### ミドルウェア(middleware)を使うにはどうすればよいですか？

`adapter-node` は、プロダクションモードで使用するためのミドルウェアを自分のサーバで構築します。開発モードでは、Vite プラグインを使用して Vite にミドルウェア(middleware) を追加することができます。例えば:

```js
const myPlugin = {
  name: 'log-request-middleware',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      console.log(`Got request ${req.url}`);
      next();
    })
  }
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		target: '#svelte',
		vite: {
			plugins: [ myPlugin ]
		}
	}
};

export default config;
```

順序を制御する方法など、詳しくは [Vite の `configureServer` のドキュメント](https://vitejs.dev/guide/api-plugin.html#configureserver) をご覧ください。

### `document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか ？

Vite はインポートされたライブラリを全て処理しようとするため、SSR と互換性がないライブラリがある場合に失敗することがあります。[現在のところ、これは SSR を無効にしていても発生します](https://github.com/sveltejs/kit/issues/754)。

`document` や `window` 変数にアクセスする必要があったり、なにかクライアントサイドだけで実行する必要がある場合は、`browser` チェックでラップすることができます:

```js
import { browser } from '$app/env';

if (browser) {
	// client-only code here
}
```

コンポーネントが最初にDOMにレンダリングされた後にコードを実行したい場合は、`onMount` で実行することもできます:

```js
import { onMount } from 'svelte';

onMount(async () => {
	const { method } = await import('some-browser-only-library');
	method('hello world');
});
```

使用したいライブラリに副作用がなければ静的にインポートすることができますし、サーバー側のビルドでツリーシェイクされ、`onMount` が自動的に no-op に置き換えられます:

```js
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library';

onMount(() => {
	method('hello world');
});
```

一方、ライブラリに副作用があっても静的にインポートをしたい場合は、[vite-plugin-iso-import](https://github.com/bluwy/vite-plugin-iso-import) をチェックして `?client` インポートサフィックスをサポートしてください。このインポートは SSR ビルドでは取り除かれます。しかし、この手法を使用すると VS Code Intellisense が使用できなくなることにご注意ください。

```js
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library?client';

onMount(() => {
	method('hello world');
});
```

### Yarn 2 で動作しますか？

多少は。Plug'n'Play 機能、通称 'pnp' は動きません (Node のモジュール解決アルゴリズムから逸脱しており、SvelteKitが [数多くのライブラリ](https://blog.sindresorhus.com/get-ready-for-esm-aa53530b3f77) とともに使用している [ネイティブの JavaScript モジュールではまだ動作しません](https://github.com/yarnpkg/berry/issues/638))。[`.yarnrc.yml`](https://yarnpkg.com/configuration/yarnrc#nodeLinker) ファイルで `nodeLinker: 'node-modules'` を使用して pnp を無効にできますが、おそらく npm や [pnpm](https://pnpm.io/) を使用するほうが簡単でしょう。同じように高速で効率的ですが、互換性に頭を悩ませることはありません。
