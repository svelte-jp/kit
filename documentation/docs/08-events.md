---
title: Events
---

特定の事象が発生すると、SvelteKit は `window` オブジェクトに [CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) を発行します。

- `sveltekit:start` — アプリがハイドレートされたとき
- `sveltekit:navigation-start` — ナビゲーションが開始されたとき
- `sveltekit:navigation-end` — ナビゲーションが終了したとき

おそらくこれらを使う必要はないでしょうけれど、(例えば) インテグレーションテストの文脈では便利でしょう。
