---
title: Service workers
---

Service Worker は、アプリ内部でネットワークリクエストを処理するプロキシサーバーとして機能します。これによりアプリをオフラインで動作させることが可能になります。もしオフラインサポートが不要な場合（または構築するアプリの種類によって現実的に実装できない場合）でも、ビルドした JS と CSS を事前にキャッシュしてナビゲーションを高速化するために Service Worker を使用する価値はあります。

SvelteKit では、`src/service-worker.js` ファイル（または `src/service-worker.ts` や `src/service-worker/index.js` など）があれば、Vite でビルドされて自動的に登録されます。Service Worker を独自のロジックで登録する必要がある場合、自動登録を無効にすることができます (例えば、更新をユーザーに促すプロンプトや、定期的な更新の設定、`workbox` の使用、など)。

> [Service Worker のロケーション](/docs/configuration#files) と [自動登録の無効化](/docs/configuration#serviceworker) についてはプロジェクトの設定で変更することができます。

Service Worker の内部では、[`$service-worker` モジュール](/docs/modules#$service-worker) にアクセスすることができます。Vite コンフィグで `define` が設定されている場合、server/client のビルドと同様、service worker にもそれが適用されます。

The service worker is bundled for production, but not during development. For that reason, only browsers that support [modules in service workers](https://web.dev/es-modules-in-sw) will be able to use them at dev time. If you are manually registering your service worker, you will need to pass the `{ type: 'module' }` option in development:

```js
import { dev } from '$app/environment';

navigator.serviceWorker.register('/service-worker.js', {
	type: dev ? 'module' : 'classic'
});
```
