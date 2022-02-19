---
title: "`package.json` の詳細をアプリケーションに含めるにはどうすればよいですか？"
---

SvelteKit は [`svelte.config.js`](/docs/configuration) を ES module として想定しているため、JSON ファイルを直接要求することはできません。もしアプリケーションに `package.json` からバージョン番号またはその他の情報を含めたい場合は、このように JSON をロードすることができます:

```js
/// file: svelte.config.js
// @filename: index.js
/// <reference types="@types/node" />
import { URL } from 'url';
// ---cut---
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);
```
