---
title: Events
---

アプリがハイドレートされると、SvelteKit は `sveltekit:start` という [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) を `window` オブジェクトに発行します。

おそらくこれらを使う必要はありませんが、(例えば) インテグレーションテストの文脈では便利でしょう。
