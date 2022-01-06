---
question: パスのエイリアスを設定するにはどうすればよいですか？
---

まず最初に、Vite の設定を追加する必要があります。`svelte.config.js` に [`vite.resolve.alias`](https://ja.vitejs.dev/config/#resolve-alias) を追加しましょう:

```js
// svelte.config.js
import path from 'path';

export default {
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
```

そして、TypeScript にエイリアスを認識させるために、(TypeScript ユーザーは) `tsconfig.json`、または `jsconfig.json` に、以下のように設定を追加します:

```js
{
  "compilerOptions": {
    "paths": {
      "$utils/*": ["src/utils/*"]
    }
  }
}
```
