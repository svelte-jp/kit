---
title: Project files
---

アプリの大部分を占める `src/routes` の中はそのままで大丈夫ですが、いくつかのプロジェクトファイルを移動または更新する必要があります。

### Configuration

[こちら](/docs#configuration)に記載されている通り、`webpack.config.js` または `rollup.config.js` を `svelte.config.js` に置き換えてください。Svelte の preprocessor オプション は `config.preprocess` に置き換えてください。

[アダプター(adapter)](/docs#adapters) を追加する必要があります。`sapper build` は [adapter-node](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) とおおよそ同じで、`sapper export` は [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) とおおよそ同じですが、デプロイ先のプラットフォーム向けにデザインされたアダプターを使用すると良いでしょう。

[Vite](https://vitejs.dev) で自動的に処理されないファイルタイプのプラグインを使用している場合は、Viteにおいて同等なことを行う方法を探し、[Vite config](/docs#configuration-vite) に追加する必要があります。

### src/client.js

SvelteKit にはこのファイルに相当するものはありません。カスタムロジック(`sapper.start(...)` 以降) は、`__layout.svelte` ファイルの `onMount` コールバック内に記述してくさい。

### src/server.js

SvelteKit アプリはサーバーレス環境で動作することを可能にしているため、このファイルも直接相当するものはありません。ただし、[hooks module](/docs#hooks) を使用してセッションロジックを実装することはできます。

### src/service-worker.js

`@sapper/service-worker` からインポートするほとんどのものは、[`$service-worker`](/docs#modules-$service-worker) に同等なものがあります:

- `timestamp` は変更されていません
- `files` は変更されていません
- `shell` は現在 `build` になりました
- `routes` は削除されました

### src/template.html

`src/template.html` は `src/app.html` にリネームする必要があります。

`%sapper.base%`、`%sapper.scripts%`、`%sapper.styles%` は削除してください。`%sapper.head%` は `%svelte.head%` に、`%sapper.html%` は `%svelte.body%` にそれぞれ置き換えてください。

`<div id="sapper">` はもう必要ありませんが、[`target`](/docs#configuration-target) コンフィグオプションでラッパー要素を指定することで、今後もそれにアプリをマウントし続けることができます。

### src/node_modules

Sapper アプリでよくあるパターンとして、内部ライブラリを `src/node_modules` 内のディレクトリに配置する、というものがあります。これは Vite だと動作しないため、代わりに [`src/lib`](/docs#modules-$lib) を使用します。
