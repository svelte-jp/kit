---
title: プロジェクト構成
---

一般的な SvelteKit プロジェクトはこのような構成です:

```bash
my-project/
├ src/
│ ├ lib/
│ │ └ [your lib files]
│ ├ params/
│ │ └ [your param matchers]
│ ├ routes/
│ │ └ [your routes]
│ ├ app.html
│ └ hooks.js
├ static/
│ └ [your static assets]
├ tests/
│ └ [your tests]
├ package.json
├ svelte.config.js
├ tsconfig.json
└ vite.config.js
```

また、`.gitignore`、`.npmrc` などの共通ファイルもあります (もし `npm create svelte@latest` の実行時にプションを選択した場合は `.prettierrc` や `.eslintrc.cjs` などもあるでしょう)。

### プロジェクトファイル

#### src

`src` ディレクトリには、プロジェクトの中身が格納します。

- `lib` にはあなたのライブラリのコードを格納します。格納されたコードは [`$lib`](/docs/modules#$lib) エイリアスを使用してインポートしたり、[`svelte-kit package`](/docs/packaging) を使用して配布用にパッケージングすることができます。
- `params` にはアプリに必要な [param matchers](/docs/advanced-routing#matching) を格納します
- `routes` にはアプリケーションの [ルート(routes)](/docs/routing) を格納します
- `app.html` はページのテンプレートで、以下のプレースホルダーを含む HTML document です:
  - `%sveltekit.head%` — アプリに必要な `<link>` 要素や `<script>` 要素、`<svelte:head>` コンテンツ 
  - `%sveltekit.body%` — レンダリングされたページのためのマークアップ
  - `%sveltekit.assets%` — [`paths.assets`](/docs/configuration#paths) が指定されている場合は [`paths.assets`](/docs/configuration#paths)、指定されていない場合は [`paths.base`](/docs/configuration#base) への相対パス
  - `%sveltekit.nonce%` — マニュアルで含めるリンクやスクリプトの [CSP](/docs/configuration#csp) ノンス (使用する場合)
- `hooks.js` (optional) アプリケーションの [hooks](/docs/hooks)
- `service-worker.js` (optional) [service worker](/docs/service-workers)

TypeScript を使用している場合、`.js` の代わりに `.ts` ファイルを使用することができます。

#### static

`robots.txt` や `favicon.png` など、そのままサーブされる静的なアセットをここに含めます。

#### tests

`npm create svelte@latest` の実行時、プロジェクトにテストを追加することを選択した場合、このディレクトリに格納されます。

#### package.json

`package.json` ファイルには `@sveltejs/kit`、`svelte`、`vite` が `devDependencies` に含まれていなければなりません。

`npm create svelte@latest` でプロジェクトを作成すると、`package.json` には `"type": "module"` が含まれることに気が付くでしょう。これは、`.js` ファイルが `import` や `export` キーワードを持つネイティブの JavaScript モジュールとして解釈されることを意味します。レガシーな CommonJS ファイルには `.cjs` ファイル拡張子が必要です。

#### svelte.config.js

このファイルには Svelte と SvelteKit の [コンフィグレーション](/docs/configuration) が含まれています。

#### tsconfig.json

`npm create svelte@latest` の際に型チェックを追加した場合、このファイル (または `.ts` ファイルより型チェックされた `.js` ファイルのほうがお好みであれば `jsconfig.json`) で TypeScript の設定を行います。SvelteKit は特定の設定に依存しているため、独自の `.svelte-kit/tsconfig.json` ファイルを生成し、あなたの設定を `extends` (拡張)しています。

#### vite.config.js

SvelteKit プロジェクトは実は、[`@sveltejs/kit/vite`](/docs/modules#sveltejs-kit-vite) プラグインと、その他の [Vite の設定](https://ja.vitejs.dev/config/) をともに使用した [Vite](https://ja.vitejs.dev) プロジェクトです。

### その他のファイル

#### test

`npm create svelte@latest` の際にテストの追加を選択した場合、`test` ディレクトリに格納されます。

#### .svelte-kit

開発してプロジェクトをビルドすると、SvelteKit は `.svelte-kit` ディレクトリ ([`outDir`](/docs/configuration#outdir) で変更可能です) にファイルを生成します。その中身を気にすることなく、いつでも削除することができます (次に `dev` や `build` を実行したときに再生成されます)。
