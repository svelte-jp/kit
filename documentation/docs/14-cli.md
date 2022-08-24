---
title: Command Line Interface
---

SvelteKit プロジェクトは [Vite](https://ja.vitejs.dev) を使用しています。つまり、ほとんどは Vite の CLI を使用することになります (`npm run dev/build/preview` scripts を経由しますが):

- `vite dev` — 開発サーバーを起動します
- `vite build` — アプリの本番バージョンをビルドします
- `vite preview` — ローカルで本番バージョンを実行します

However SvelteKit includes its own CLI for initialising your project:

### svelte-kit sync

`svelte-kit sync` は、型や `tsconfig.json` などのプロジェクト用に生成されるファイルを作成します。プロジェクトを作成すると、`prepare` script としてリストアップされ、npm ライフサイクルの一部として自動的に実行されるので、通常はこのコマンドを実行する必要はないはずです。
