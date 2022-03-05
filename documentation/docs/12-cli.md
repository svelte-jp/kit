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
- `--host` — サーバーをネットワークに公開するか
- `--https` — 自己署名証明書を使用してHTTPSサーバーを起動するか。外部のデバイスでHTTPS-onlyな機能をテストするのに便利です

> 指定したポート (またはデフォルトのポート) が使用できない場合、このコマンドは失敗します。失敗させるのではなく、別のポートを使用するには [`config.kit.vite.server.strictPort`](/docs/configuration#vite) オプションを `false` にしてください。

### svelte-kit build

アプリのプロダクションバージョンをビルドし、[コンフィグ](/docs/configuration) で adapter が指定されている場合はそれを実行します。以下のオプションを受け付けます:

- `--verbose` — より詳細なログ

アプリのビルド後、選択した [adapter](/docs/adapters) とホスティングプラットフォームのドキュメントを参照し、アプリの提供に関する具体的な方法を確認することができます。

### svelte-kit preview

`svelte-kit build` でアプリをビルドした後、`svelte-kit preview` により、ローカルで(適用されている adapter に関係なく)プロダクションバージョンを起動することができます。これはローカルでプロダクションビルドをテストするためのもので、**アプリを提供するためのものではありません**。その場合は常に [adapter](/docs/adapters) を使用する必要があります。

`svelte-kit dev` と同じように、以下のオプションを受け付けます:

- `-p`/`--port`
- `-o`/`--open`
- `--host`
- `--https`

### svelte-kit package

> `svelte-kit package` は現時点では experimental で、セマンティックバージョニングのルールの対象外です。将来のリリースで後方互換性のない変更が行われる可能性があります。

パッケージ作者の方は、[packaging](/docs/packaging) をご覧ください。
