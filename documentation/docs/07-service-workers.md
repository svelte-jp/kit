---
title: Service workers
---

Service Worker は、アプリ内部でネットワークリクエストを処理するプロキシサーバーとして機能します。これによりアプリをオフラインで動作させることが可能になります。もしオフラインサポートが不要な場合（または構築するアプリの種類によって現実的に実装できない場合）でも、ビルドした JS と CSS を事前にキャッシュしてナビゲーションを高速化するために Service Worker を使用する価値はあります。

SvelteKit では、`src/service-worker.js` ファイル（または `src/service-worker.ts` や `src/service-worker/index.js` など）があれば、Vite でビルドされて自動的に登録されます。Service Worker を独自のロジックで登録する必要がある場合、自動登録を無効にすることができます (例えば、更新をユーザーに促すプロンプトや、定期的な更新の設定、`workbox` の使用、など)。

> You can change the [location of your service worker](/docs/configuration#files) and [disable automatic registration](/docs/configuration#serviceworker) in your project configuration.

Service Worker の内部では、[`$service-worker` モジュール](/docs/modules#$service-worker) にアクセスすることができます。

Service Worker はバンドルする必要があり（現状はブラウザがまだ `import` をサポートしていないため）、クライアント側アプリのビルドマニフェストに依存するため、**Service Worker は開発時ではなく本番ビルドでのみ機能します**。ローカル環境でテストするには、[`svelte-kit preview`](/docs/cli#svelte-kit-preview) を使用してください。
