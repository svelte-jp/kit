---
title: パスのエイリアスを設定するにはどうすればよいですか？
---

まず最初に、Vite の設定を追加する必要があります。`svelte.config.js` に [`vite.resolve.alias`](https://ja.vitejs.dev/config/#resolve-alias) を追加しましょう:

```js
/// file: svelte.config.js
// @filename: ambient.d.ts
declare module 'path';

// @filename: index.js
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		vite: {
			resolve: {
				alias: {
					$utils: path.resolve('./src/utils')
				}
			}
		}
	}
};

export default config;
```

そして、TypeScript にエイリアスを認識させるために、(TypeScript ユーザーは) `tsconfig.json`、または `jsconfig.json` に、以下のように設定を追加します:

```json
{
	"compilerOptions": {
		"paths": {
			"$utils/*": ["src/utils/*"]
		}
	}
}
```
