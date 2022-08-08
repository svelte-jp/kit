---
title: Service workers
---

Service Worker は、アプリ内部でネットワークリクエストを処理するプロキシサーバーとして機能します。これによりアプリをオフラインで動作させることが可能になります。もしオフラインサポートが不要な場合（または構築するアプリの種類によって現実的に実装できない場合）でも、ビルドした JS と CSS を事前にキャッシュしてナビゲーションを高速化するために Service Worker を使用する価値はあります。

SvelteKit では、`src/service-worker.js` ファイル（または `src/service-worker.ts` や `src/service-worker/index.js` など）があれば、Vite でビルドされて自動的に登録されます。Service Worker を独自のロジックで登録する必要がある場合、自動登録を無効にすることができます (例えば、更新をユーザーに促すプロンプトや、定期的な更新の設定、`workbox` の使用、など)。

> [Service Worker のロケーション](/docs/configuration#files) と [自動登録の無効化](/docs/configuration#serviceworker) についてはプロジェクトの設定で変更することができます。

Service Worker の内部では、[`$service-worker` モジュール](/docs/modules#$service-worker) にアクセスすることができます。

Because it needs to be bundled (since browsers don't yet support `import` in this context), and depends on the client-side app's build manifest, **service workers only work in the production build, not in development**. To test it locally, use `vite preview`.
