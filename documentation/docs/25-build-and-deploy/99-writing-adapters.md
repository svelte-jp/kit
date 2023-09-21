---
title: adapter を書く
---

あなたが使いたい環境向けの adapter がまだ存在しない場合は、ご自身で adapter を作成することができます。あなたが使いたい環境に似ているプラットフォームの [adapter のソースを見て](https://github.com/sveltejs/kit/tree/master/packages)、コピーするところから始めることをおすすめします。

Adapter パッケージは以下の API を実装しなければなりません。これによって `Adapter` が作られます:

```js
// @filename: ambient.d.ts
type AdapterSpecificOptions = any;

// @filename: index.js
// ---cut---
/** @param {AdapterSpecificOptions} options */
export default function (options) {
	/** @type {import('@sveltejs/kit').Adapter} */
	const adapter = {
		name: 'adapter-package-name',
		async adapt(builder) {
			// adapter implementation
		}
	};

	return adapter;
}
```

`Adapter` の型とそのパラメータは [types/index.d.ts](https://github.com/sveltejs/kit/blob/master/packages/kit/types/index.d.ts) にて利用可能です。

`adapt` メソッドの中で、adapter が行うべきことがいくつかあります:

- build ディレクトリの掃除
- SvelteKit の出力を `builder.writeClient`、`builder.writeServer`、`builder.writePrerendered` で書き出す
- これらのコードを出力する:
	- `${builder.getServerDirectory()}/index.js` から `Server` をインポートする
	- `builder.generateManifest({ relativePath })` で生成された manifest でアプリをインスタンス化する
	- 必要に応じて、プラットフォームからのリクエストをリスン(Listen)しそのリクエストを標準の [Request](https://developer.mozilla.org/ja/docs/Web/API/Request) に変換し、`server.respond(request, { getClientAddress })` 関数を呼び出して [Response](https://developer.mozilla.org/ja/docs/Web/API/Response) を生成して応答する
	- `server.respond` に渡される `platform` オプションを使用してプラットフォーム固有の情報を SvelteKit に公開する
	- 必要に応じて、ターゲットのプラットフォームで動作するよう `fetch` をグローバルにシム(shim)する。SvelteKit は、プラットフォームが `undici` を使用できるようにするための `@sveltejs/kit/node/polyfills` ヘルパーを提供しています
- 必要に応じて、ターゲットのプラットフォームで依存関係(dependencies)をインストールするのを避けるため、出力をバンドルする
- ユーザーの静的ファイルと生成された JS/CSS をターゲットのプラットフォームにとって適切な場所に配置する

可能であれば、adapter の出力は `build/` ディレクトリに置き、中間出力は `.svelte-kit/[adapter-name]` に置くことをおすすめします。
