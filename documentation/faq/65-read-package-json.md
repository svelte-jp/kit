---
question: "`package.json` の詳細をアプリケーションに含めるにはどうすればよいですか？"
---

SvelteKit は [`svelte.config.js`](/docs#configuration) を ES module として想定しているため、JSON ファイルを直接要求することはできません。もしアプリケーションに `package.json` からバージョン番号またはその他の情報を含めたい場合は、このように JSON をロードすることができます:

```js
const pkg = JSON.parse(fs.readFileSync(new URL('package.json', import.meta.url), 'utf8'));
```
