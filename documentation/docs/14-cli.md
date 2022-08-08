---
title: Command Line Interface
---

SvelteKit プロジェクトは [Vite](https://ja.vitejs.dev) を使用しています。つまり、ほとんどは Vite の CLI を使用することになります (`npm run dev/build/preview` scripts を経由しますが):

- `vite dev` — 開発サーバーを起動します
- `vite build` — アプリの本番バージョンをビルドします
- `vite preview` — ローカルで本番バージョンを実行します

しかしながら SvelteKit には、配布可能なパッケージの作成やプロジェクト初期化のための CLI も含まれています:

### svelte-kit package

> `svelte-kit package` は現時点では experimental で、セマンティックバージョニングのルールの対象外です。将来のリリースで後方互換性のない変更が行われる可能性があります。

[packaging](/docs/packaging) をご覧ください。`svelte-kit package` は以下のオプションを受け取ります:

- `-w`/`--watch` — `src/lib` にあるファイルの変更をウォッチし、パッケージを再ビルドします

### svelte-kit sync

`svelte-kit sync` は、型や `tsconfig.json` などのプロジェクト用に生成されるファイルを作成します。プロジェクトを作成すると、`prepare` script としてリストアップされ、npm ライフサイクルの一部として自動的に実行されるので、通常はこのコマンドを実行する必要はないはずです。
