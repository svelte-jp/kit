---
title: SvelteKit で X を使うにはどうすればよいですか？
---

[ドキュメントのインテグレーションのセクション](/docs/additional-resources#integrations) をしっかり読み込んでください。それでも問題が解決しない場合のために、よくある問題の解決策を以下に示します。

### データベースのセットアップはどう行えばよいですか？

データベースに問い合わせを行うコードを [エンドポイント](/docs/routing#endpoints) に置いてください - .svelte ファイルの中でデータベースに問い合わせを行わないでください。コネクションをすぐにセットアップし、シングルトンとしてアプリ全体からクライアントにアクセスできるように `db.js` のようなものを作ることができます。`hooks.js` で1回セットアップするコードを実行し、データベースヘルパーを必要とするすべてのエンドポイントにインポートできます。

### ミドルウェア(middleware)を使うにはどうすればよいですか？

`adapter-node` は、プロダクションモードで使用するためのミドルウェアを自分のサーバで構築します。開発モードでは、Vite プラグインを使用して Vite にミドルウェア(middleware) を追加することができます。例えば:

```js
// @filename: ambient.d.ts
declare module '@sveltejs/kit/vite'; // TODO this feels unnecessary, why can't it 'see' the declarations?

// @filename: index.js
// ---cut---
import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').Plugin} */
const myPlugin = {
	name: 'log-request-middleware',
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			console.log(`Got request ${req.url}`);
			next();
		});
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [myPlugin, sveltekit()]
};

export default config;
```

順序を制御する方法など、詳しくは [Vite の `configureServer` のドキュメント](https://ja.vitejs.dev/guide/api-plugin.html#configureserver) をご覧ください。

### `document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？

もし `document` や `window` 変数にアクセスする必要があったり、クライアントサイドだけで実行するコードが必要な場合は、`browser` チェックでラップしてください:

```js
/// <reference types="@sveltejs/kit" />
// ---cut---
import { browser } from '$app/env';

if (browser) {
	// client-only code here
}
```

コンポーネントが最初にDOMにレンダリングされた後にコードを実行したい場合は、`onMount` で実行することもできます:

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';

onMount(async () => {
	const { method } = await import('some-browser-only-library');
	method('hello world');
});
```

使用したいライブラリに副作用がなければ静的にインポートすることができますし、サーバー側のビルドでツリーシェイクされ、`onMount` が自動的に no-op に置き換えられます:

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library';

onMount(() => {
	method('hello world');
});
```

一方、ライブラリに副作用があっても静的にインポートをしたい場合は、[vite-plugin-iso-import](https://github.com/bluwy/vite-plugin-iso-import) をチェックして `?client` インポートサフィックスをサポートしてください。このインポートは SSR ビルドでは取り除かれます。しかし、この手法を使用すると VS Code Intellisense が使用できなくなることにご注意ください。

```js
// @filename: ambient.d.ts
// @lib: ES2015
declare module 'some-browser-only-library?client';

// @filename: index.js
// ---cut---
import { onMount } from 'svelte';
import { method } from 'some-browser-only-library?client';

onMount(() => {
	method('hello world');
});
```

### How do I use with Yarn?

#### Does it work with Yarn 2?

Sort of. The Plug'n'Play feature, aka 'pnp', is broken (it deviates from the Node module resolution algorithm, and [doesn't yet work with native JavaScript modules](https://github.com/yarnpkg/berry/issues/638) which SvelteKit — along with an [increasing number of packages](https://blog.sindresorhus.com/get-ready-for-esm-aa53530b3f77) — uses). You can use `nodeLinker: 'node-modules'` in your [`.yarnrc.yml`](https://yarnpkg.com/configuration/yarnrc#nodeLinker) file to disable pnp, but it's probably easier to just use npm or [pnpm](https://pnpm.io/), which is similarly fast and efficient but without the compatibility headaches.

#### How do I use with Yarn 3?

Currently ESM Support within the latest Yarn (version 3) is considered [experimental](https://github.com/yarnpkg/berry/pull/2161).

The below seems to work although your results may vary.

First create a new application:

```sh
yarn create svelte myapp
cd myapp
```

And enable Yarn Berry:

```sh
yarn set version berry
yarn install
```

**Yarn 3 global cache**

One of the more interesting features of Yarn Berry is the ability to have a single global cache for packages, instead of having multiple copies for each project on the disk. However, setting `enableGlobalCache` to true causes building to fail, so it is recommended to add the following to the `.yarnrc.yml` file:

```
nodeLinker: node-modules
```

This will cause packages to be downloaded into a local node_modules directory but avoids the above problem and is your best bet for using version 3 of Yarn at this point in time.
