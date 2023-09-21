---
title: アプリをビルドする
---

SvelteKit アプリのビルドは2つのステージで行われます。どちらも `vite build` (通常は `npm run build` を経由します) を実行したときに行われます。

まず最初に、Vite がサーバーのコード、ブラウザのコード、service worker(もしあれば) の、最適化された本番向けビルドを作成します。必要に応じて、このステージで [プリレンダリング](page-options#prerender) が実行されます。

次に、*adapter* がこの本番向けビルドをあなたがデプロイしたいターゲットの環境向けに調整します — これについての詳細は以降のページにございます。

## ビルド中に <!--during-the-build-->

SvelteKit はビルド中に、解析のために `+page/layout(.server).js` ファイル (とそこにインポートされている全てのファイル) を読み込みます。このステージで読み込まれるべきでないコードがある場合は、[`$app/environment`](modules#$app-environment) からインポートする `building` が `false` であることをチェックするコードを追加してください:

```diff
+import { building } from '$app/environment';
import { setupMyDatabase } from '$lib/server/database';

+if (!building) {
	setupMyDatabase();
+}

export function load() {
	// ...
}
```

## アプリのプレビュー <!--preview-your-app-->

ビルド後、`vite preview` (`npm run preview` 経由) を使用してローカルで本番向けビルドを確認することができます。これは Node 上でアプリを実行しているので、デプロイされるアプリの完全な再現ではないことにご注意ください。[`platform` オブジェクト](adapters#platform-specific-context) などの adapter 固有の調整はプレビューには適用されません。
