---
title: Configuration
---

プロジェクトの設定は、プロジェクトの root にある `svelte.config.js` ファイルに保存されています。SvelteKit だけでなく、エディタ拡張(editor extensions)など Svelte とインテグレーションする他のツールでもこれが使用されます。

```js
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;
```

> TYPES: @sveltejs/kit#Config

`kit` プロパティは SvelteKit を設定し、以下のプロパティを持つことができます:

> EXPANDED_TYPES: @sveltejs/kit#KitConfig