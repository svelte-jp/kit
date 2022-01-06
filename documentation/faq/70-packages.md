---
question: パッケージをインクルードしようとするとエラーが発生するのですが、どうすれば直せますか？
---

Vite の SSR はまだ stable ではありません。ライブラリはそのパッケージが CJS と ESM の両方で配布されていると Vite で最も良く動作するので、これを実現するためのライブラリの作者たちに働きかけると良いでしょう。

Svelte コンポーネントは全て ESM で書かれていなければなりません。外部の Svelte コンポーネントの依存関係が ESM バージョンを提供していることを確認することが推奨されます。しかし、CJS の依存関係を処理するため、[`vite-plugin-svelte` は外部の Svelte コンポーネントの CJS の依存関係を探し出し](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies)、それらを自動的に Vite の `optimizeDeps.include` に追加し、それらを ESM に変換するために `esbuild` を使用して pre-bundle するよう Vite に指示します。

上記のアプローチの副作用は、初期ページのロードが長くなってしまうことです。これが気になる場合は、`svelte.config.js` で [experimental.prebundleSvelteLibraries: true](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#prebundlesveltelibraries) を設定してみてください。このオプションは experimental であることにご注意ください。

それでもまだ問題が解消されない場合は、[SvelteKit ユーザーに影響する既知の Vite の issue 一覧](https://github.com/sveltejs/kit/issues/2086) をチェックし、[Vite の issue tracker](https://github.com/vitejs/vite/issues) と 該当のライブラリの issue tracker を検索することを推奨します。[`optimizeDeps`](https://vitejs.dev/config/#dep-optimization-options) や [`ssr`](https://vitejs.dev/config/#ssr-options) の設定値をいじることで問題を回避できる場合もあります。
