---
title: Endpoints
---

Sapper では、'server routes' — 現在は [エンドポイント(endpoints)](/docs#routing-endpoints) と呼ばれるもの — は、Node の `http` モジュール によって公開される `req` と `res` オブジェクト(または Polka や Express などのフレームワークが提供する拡張版) を受け取っていました。

SvelteKit は、アプリが動作する場所に依存しないように設計されています — Node サーバーで動作し、サーバーレスプラットフォームや Cloudflare Worker でも同様に動作します。そのため、もう `req` と `res` を直接扱いません。エンドポイントを、新しいシグネチャに合わせて更新する必要があります。

環境非依存な動作をサポートするため、グローバルコンテキストで `fetch` が利用できるようになり、`node-fetch` や `cross-fetch` などのサーバーサイドの fetch 実装をインポートする必要がなくなりました。
