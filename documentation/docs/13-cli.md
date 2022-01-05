---
title: Command Line Interface
---

SvelteKit にはアプリのビルドと実行のためのコマンドラインインタフェースがあります。

デフォルトのプロジェクトテンプレートでは、`svelte-kit dev`、`svelte-kit build`、`svelte-kit preview` はそれぞれ `npm run dev`、`npm run build`、`npm run preview` でエイリアスされています。また、[npx](https://www.npmjs.com/package/npx) でCLIを実行することもできます:

```bash
npx svelte-kit dev
```

### svelte-kit dev

開発サーバーを起動します。以下のオプションを受け付けます:

- `-p`/`--port` — どのポートでサーバーを起動するか
- `-o`/`--open` — サーバーを起動したときにブラウザのタブを開くか
- `-h`/`--host` — サーバーをネットワークに公開するか
- `-H`/`--https` — 自己署名証明書を使用してHTTPSサーバーを起動するか。外部のデバイスでHTTPS-onlyな機能をテストするのに便利です

### svelte-kit build

アプリのプロダクションバージョンをビルドし、[コンフィグ](#configuration) でアダプターが指定されている場合はそれを実行します。以下のオプションを受け付けます:

- `--verbose` — より詳細なログ

アプリのビルド後、選択した [アダプター](#adapters) とホスティングプラットフォームのドキュメントを参照し、アプリの提供に関する具体的な方法を確認することができます。

### svelte-kit preview

`svelte-kit build` でアプリをビルドした後、`svelte-kit preview` により、ローカルで(適用されているアダプターに関係なく)プロダクションバージョンを起動することができます。これはローカルでプロダクションビルドをテストするためのもので、**アプリを提供するためのものではありません**。その場合は常に [アダプター](#adapters) を使用する必要があります。

`svelte-kit dev` と同じように、以下のオプションを受け付けます:

- `-p`/`--port`
- `-o`/`--open`
- `-h`/`--host`
- `-H`/`--https`

### svelte-kit package

パッケージ作者の方は、[packaging](#packaging) をご覧ください。
