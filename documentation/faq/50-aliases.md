---
title: パスのエイリアスを設定するにはどうすればよいですか？
---

Aliases can be set in `svelte.config.js` as described in the [`configuration`](/docs/configuration#alias) docs.

Then run `npm run sync` or `npm run dev` (which will execute `sync`). SvelteKit will automatically generate the required alias configuration in `jsconfig.json` or `tsconfig.json`.
