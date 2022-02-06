---
title: パッケージをインクルードしようとするとエラーが発生するのですが、どうすれば直せますか？
---

Vite の SSR サポートは Vite 2.7 以降かなり安定しています。ライブラリのインクルードに関する問題は、ほとんどが不適切なパッケージングによるものです。

Vite の場合、ライブラリは ESM バージョンが配布されているともっともうまく動作するので、ライブラリの作者にそれを提案すると良いでしょう。以下は、ライブラリが正しくパッケージングされているかどうかをチェックする際に気を付けるべき点です:

- `exports` は `main` や `module` などの他のエントリーポイントのフィールドよりも優先されます。`exports` フィールドを追加すると、deep import を妨げることになるため、後方互換性が失われる場合があります。
- `"type": "module"` が指定されていない限り、ESM ファイルは `.mjs` で終わる必要があり、CommonJS ファイルは `.cjs` で終わる必要があります。
-  `exports` が定義されていない場合、`main` を定義する必要があり、それは CommonJS ファイル か ESM ファイル でなければならず、前項に従わなければならない。`module` フィールドが定義されている場合、ESM ファイルを参照している必要があります。
- Svelte コンポーネントは完全に ESM として配布される必要があり、また、エントリーポイントを定義する `svelte` フィールドがなければなりません。

外部の Svelte コンポーネントの依存関係(dependencies)が ESM バージョンを提供していることを確認することが推奨されます。しかし、CommonJS の依存関係(dependencies) を扱うため、[`vite-plugin-svelte` は外部の Svelte コンポーネントの CJS の依存関係(dependencies) を探し](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies)、Vite に対し、自動的に Vite の `optimizeDeps.include` にそれらを追加して事前バンドル(pre-bundle)するよう依頼します。Vite はそれらを ESM に変換するのに `esbuild` を使用します。このアプローチの副作用は初期ページのロードに時間がかかることです。もしこれが気になるなら、`svelte.config.js` で [experimental.prebundleSvelteLibraries: true](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#prebundlesveltelibraries) を設定してみてください。このオプションは experimental であることにご注意ください。

それでもまだ問題が解消されない場合は、[SvelteKit ユーザーに影響する既知の Vite の issue 一覧](https://github.com/sveltejs/kit/issues/2086) をチェックし、[Vite の issue tracker](https://github.com/vitejs/vite/issues) と 該当のライブラリの issue tracker を検索することを推奨します。[`optimizeDeps`](https://ja.vitejs.dev/config/#%E4%BE%9D%E5%AD%98%E9%96%A2%E4%BF%82%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) や [`ssr`](https://ja.vitejs.dev/config/#ssr-%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) の設定値をいじることで問題を回避できる場合もあります。
