---
title: プロジェクト構成
---

一般的な SvelteKit プロジェクトはこのような構成です:

```bash
my-project/
├ src/
│ ├ lib/
│ │ ├ server/
│ │ │ └ [your server-only lib files]
│ │ └ [your lib files]
│ ├ params/
│ │ └ [your param matchers]
│ ├ routes/
│ │ └ [your routes]
│ ├ app.html
│ ├ error.html
│ ├ hooks.client.js
│ ├ hooks.server.js
│ └ service-worker.js
├ static/
│ └ [your static assets]
├ tests/
│ └ [your tests]
├ package.json
├ svelte.config.js
├ tsconfig.json
└ vite.config.js
```

また、`.gitignore`、`.npmrc` などの共通ファイルもあります (もし `npm create svelte@latest` の実行時にオプションを選択した場合は `.prettierrc` や `.eslintrc.cjs` などもあるでしょう)。

## プロジェクトファイル <!--project-files-->

### src

`src` ディレクトリには、プロジェクトの中身が格納されます。`src/routes` と `src/app.html` 以外は全て省略できます。

- `lib` にはあなたのライブラリのコード (ユーティリティやコンポーネント) を格納します。格納されたコードは [`$lib`](modules#$lib) エイリアスを使用してインポートしたり、[`svelte-package`](packaging) を使用して配布用にパッケージングすることができます。
  - `server` にはあなたのサーバー専用のライブラリのコードを格納します。格納されたコードは [`$lib/server`](server-only-modules) エイリアスを使用してインポートすることができます。SvelteKit はこれをクライアントコードにインポートされるのを防ぎます。
- `params` にはアプリに必要な [param matchers](advanced-routing#matching) を格納します
- `routes` にはアプリケーションの [ルート(routes)](routing) を格納します。単一のルート(route)でしか使われないコンポーネントをここに置くこともできます
- `app.html` はページのテンプレートで、以下のプレースホルダーを含む HTML document です:
  - `%sveltekit.head%` — アプリに必要な `<link>` 要素や `<script>` 要素、`<svelte:head>` コンテンツ 
  - `%sveltekit.body%` — レンダリングされるページのためのマークアップです。これを直接 `<body>` の中に置くのではなく、`<div>` または他の要素の中に置く必要があります。ブラウザ拡張(browser extensions)が要素を注入するのをハイドレーションプロセスが破壊してしまう、というバグを防ぐためです。もしこうなっていない場合、SvelteKit は開発中に警告を出します
  - `%sveltekit.assets%` — [`paths.assets`](configuration#paths) が指定されている場合は [`paths.assets`](configuration#paths)、指定されていない場合は [`paths.base`](configuration#paths) への相対パス
  - `%sveltekit.nonce%` — マニュアルで含めるリンクやスクリプトの [CSP](configuration#csp) nonce (使用する場合)
  - `%sveltekit.env.[NAME]%` - これはレンダリング時に環境変数の `[NAME]` に置き換えられます。この環境変数は [`publicPrefix`](configuration#env) で始まる必要があります (通常は `PUBLIC_` です)。もしマッチしない場合は `''` にフォールバックします。
- `error.html` は、全てが失敗したときにレンダリングされるページです。以下のプレースホルダーを含めることができます:
  - `%sveltekit.status%` — HTTP ステータス
  - `%sveltekit.error.message%` — エラーメッセージ
- `hooks.client.js` にはクライアントの [hooks](hooks) を記述します
- `hooks.server.js` にはサーバーの [hooks](hooks) を記述します
- `service-worker.js` には [service worker](service-workers) を記述します

(プロジェクトに `.js` と `.ts` のどちらのファイルが含まれるかについては、プロジェクトの作成時に TypeScript の使用を選択したかどうかによります。このドキュメントに記載されているコードやファイル拡張子などは、ページの下にあるトグルを使って、JavaScript と TypeScript を切り替えることができます。)

プロジェクトのセットアップ時に [Vitest](https://vitest.dev) を追加した場合、ユニットテストは `.test.js` という拡張子で `src` ディレクトリに置かれます。

### static

`robots.txt` や `favicon.png` など、そのままサーブされる静的なアセットをここに含めます。

### tests

プロジェクトのセットアップ時、ブラウザテストのために [Playwright](https://playwright.dev/) を追加した場合、そのテストはこのディレクトリに置かれます。

### package.json

`package.json` ファイルには `@sveltejs/kit`、`svelte`、`vite` が `devDependencies` に含まれていなければなりません。

`npm create svelte@latest` でプロジェクトを作成すると、`package.json` には `"type": "module"` が含まれることに気が付くでしょう。これは、`.js` ファイルが `import` や `export` キーワードを持つネイティブの JavaScript モジュールとして解釈されることを意味します。レガシーな CommonJS ファイルには `.cjs` ファイル拡張子が必要です。

### svelte.config.js

このファイルには Svelte と SvelteKit の[設定](configuration)が含まれています。

### tsconfig.json

`npm create svelte@latest` の際に型チェックを追加した場合、このファイル (または `.ts` ファイルより型チェックされた `.js` ファイルのほうがお好みであれば `jsconfig.json`) で TypeScript の設定を行います。SvelteKit は特定の設定に依存しているため、独自の `.svelte-kit/tsconfig.json` ファイルを生成し、あなたの設定を `extends` (拡張)しています。

### vite.config.js

SvelteKit プロジェクトは実は、[`@sveltejs/kit/vite`](modules#sveltejs-kit-vite) プラグインと、その他の [Vite の設定](https://ja.vitejs.dev/config/) を一緒に使用した [Vite](https://ja.vitejs.dev) プロジェクトです。

## その他のファイル <!--other-files-->

### .svelte-kit

開発してプロジェクトをビルドすると、SvelteKit は `.svelte-kit` ディレクトリ ([`outDir`](configuration#outdir) で変更可能です) にファイルを生成します。その中身を気にすることなく、いつでも削除することができます (次に `dev` や `build` を実行したときに再生成されます)。
