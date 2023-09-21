---
title: Adapters
---

SvelteKit アプリをデプロイする前に、それをデプロイ先の環境に _合わせる(adapt)_ 必要があります。adapter は、ビルドされたアプリをインプットとして受け取りデプロイ用のアウトプットを生成する小さなプラグインです。

様々なプラットフォーム向けの公式の adapter があります。これらについて以降のページにドキュメントがあります。

- [`@sveltejs/adapter-cloudflare`](adapter-cloudflare) for Cloudflare Pages
- [`@sveltejs/adapter-cloudflare-workers`](adapter-cloudflare-workers) for Cloudflare Workers
- [`@sveltejs/adapter-netlify`](adapter-netlify) for Netlify
- [`@sveltejs/adapter-node`](adapter-node) for Node servers
- [`@sveltejs/adapter-static`](adapter-static) for static site generation (SSG)
- [`@sveltejs/adapter-vercel`](adapter-vercel) for Vercel

加えて、他のプラットフォーム向けに、[コミュニティによって提供されている adapter](https://sveltesociety.dev/components#adapters) もございます。

## adapter を使用する <!--using-adapters-->

adapter は `svelte.config.js` に指定します。

```js
/// file: svelte.config.js
// @filename: ambient.d.ts
declare module 'svelte-adapter-foo' {
	const adapter: (opts: any) => import('@sveltejs/kit').Adapter;
	export default adapter;
}

// @filename: index.js
// ---cut---
import adapter from 'svelte-adapter-foo';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// adapter options go here
		})
	}
};

export default config;
```

## プラットフォーム固有の情報 <!--platform-specific-context-->

adapter によっては、リクエストに関する追加情報にアクセスすることができます。例えば、Cloudflare Workers の場合は KV namespaces などを含む `env` オブジェクトにアクセスできます。これは [hooks](hooks) や [サーバールート(server routes)](routing#server) で使用される `RequestEvent` に、`platform` プロパティとして渡されます。詳しくは、各 adapter のドキュメントをご参照ください。

