---
title: パッケージをインクルードしようとするとエラーが発生するのですが、どうすれば直せますか？
---

ライブラリのインクルードに関する問題は、ほとんどが不適切なパッケージングによるものです。ライブラリのパッケージングが Node.js に対応しているかどうかは、[publint の web サイト](https://publint.dev/) でチェックできます。

以下は、ライブラリが正しくパッケージングされているかどうかをチェックする際に気を付けるべき点です:

- `exports` は `main` や `module` などの他のエントリーポイントのフィールドよりも優先されます。`exports` フィールドを追加すると、deep import を妨げることになるため、後方互換性が失われる場合があります。
- `"type": "module"` が指定されていない限り、ESM ファイルは `.mjs` で終わる必要があり、CommonJS ファイルは `.cjs` で終わる必要があります。
-  `exports` が定義されていない場合、`main` を定義する必要があり、それは CommonJS ファイル か ESM ファイル でなければならず、前項に従わなければならない。`module` フィールドが定義されている場合、ESM ファイルを参照している必要があります。
- Svelte コンポーネントは、コンパイルされていない `.svelte` ファイルとして配布し、パッケージに含まれる JS は ESM のみとして記述していなければなりません。TypeScript などのカスタムスクリプトや SCSS などのスタイル言語は、それぞれ vanilla JS と CSS にするために前処理(preprocess)をしなければなりません。Svelte ライブラリのパッケージングには、[`svelte-package`](docs/packaging) を使用することを推奨しています。このパッケージによって、これらの作業が行われます。

ライブラリが ESM バージョンを配布している場合、特に Svelte コンポーネントライブラリがその依存関係に含まれている場合、Vite を使用するとブラウザ上で最適に動作します。ライブラリの作者に ESM バージョンを提供するよう提案すると良いでしょう。しかし、CommonJS (CJS) の依存関係も上手く扱えるようにするため、デフォルトで、[`vite-plugin-svelte` が Vite にそれらを事前バンドルするよう指示します](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md#what-is-going-on-with-vite-and-pre-bundling-dependencies)。Vite は `esbuild` を使ってそれらを ESM に変換します。

それでもまだ問題が解消されない場合は、[Vite の issue tracker](https://github.com/vitejs/vite/issues) と 該当のライブラリの issue tracker を検索することを推奨します。[`optimizeDeps`](https://ja.vitejs.dev/config/#%E4%BE%9D%E5%AD%98%E9%96%A2%E4%BF%82%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) や [`ssr`](https://ja.vitejs.dev/config/#ssr-%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3) の設定値をいじることで問題を回避できる場合もありますが、これはあくまで一時的な回避策とし、問題のあるライブラリの修正を優先したほうが良いでしょう。
