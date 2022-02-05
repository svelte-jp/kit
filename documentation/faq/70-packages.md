---
title: パッケージをインクルードしようとするとエラーが発生するのですが、どうすれば直せますか？
---

Vite の SSR サポートは Vite 2.7 以降かなり安定しています。ライブラリのインクルードに関する問題は、ほとんどが不適切なパッケージングによるものです。

Libraries work best with Vite when they distribute an ESM version and you may wish to suggest this to library authors. Here are a few things to keep in mind when checking if a library is packaged correctly:

- `exports` takes precedence over the other entry point fields such as `main` and `module`. Adding an `exports` field may not be backwards-compatible as it prevents deep imports.
- ESM files should end with `.mjs` unless `"type": "module"` is set in which any case CommonJS files should end with `.cjs`.
- `main` should be defined if `exports` is not. It should be either a CommonJS or ESM file and adhere to the previous bullet. If a `module` field is defined, it should refer to an ESM file.
- Svelte components should be distributed entirely as ESM and have a `svelte` field defining the entry point.

It is encouraged to make sure the dependencies of external Svelte components provide an ESM version. However, in order to handle CommonJS dependencies [`vite-plugin-svelte` will look for any CJS dependencies of external Svelte components](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies) and ask Vite to pre-bundle them by automatically adding them to Vite's `optimizeDeps.include` which will use `esbuild` to convert them to ESM. A side effect of this approach is that it takes longer to load the initial page. If this becomes noticable, try setting [experimental.prebundleSvelteLibraries: true](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#prebundlesveltelibraries) in `svelte.config.js`. Note that this option is experimental.

それでもまだ問題が解消されない場合は、[SvelteKit ユーザーに影響する既知の Vite の issue 一覧](https://github.com/sveltejs/kit/issues/2086) をチェックし、[Vite の issue tracker](https://github.com/vitejs/vite/issues) と 該当のライブラリの issue tracker を検索することを推奨します。[`optimizeDeps`](https://ja.vitejs.dev/config/#%E4%BE%9D%E5%AD%98%E9%96%A2%E4%BF%82%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) や [`ssr`](https://ja.vitejs.dev/config/#ssr-%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) の設定値をいじることで問題を回避できる場合もあります。
