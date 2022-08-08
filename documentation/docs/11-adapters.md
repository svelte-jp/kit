---
title: Adapters
---

SvelteKit アプリをデプロイする前に、それをデプロイ先の環境に _合わせる(adapt)_ 必要があります。adapter は、ビルドされたアプリをインプットとして受け取り、デプロイ用のアウトプットを生成する小さなプラグインです。

デフォルトでは、プロジェクトは `@sveltejs/adapter-auto` を使用するように設定されており、プロダクション環境を検出して可能な限り適切な adapter を選択します。もし(まだ)プラットフォームがサポートされていなければ、[custom adapter をインストール](/docs/adapters#community-adapters)するか、[custom adapter を作成](/docs/adapters#writing-custom-adapters)する必要があるかもしれません。

> 新しい環境のサポートを追加することに関しては、[adapter-auto の README](https://github.com/sveltejs/kit/tree/master/packages/adapter-auto) をご参照ください。

### サポートされている環境

SvelteKit は、公式にサポートされている adapter を多数提供しています。

以下のプラットフォームには、デフォルトの adapter である `adapter-auto` でデプロイが可能です。

- [Cloudflare Pages](https://developers.cloudflare.com/pages/) — [`adapter-cloudflare`](https://github.com/sveltejs/kit/tree/master/packages/adapter-cloudflare)
- [Netlify](https://netlify.com) — [`adapter-netlify`](https://github.com/sveltejs/kit/tree/master/packages/adapter-netlify)
- [Vercel](https://vercel.com) — [`adapter-vercel`](https://github.com/sveltejs/kit/tree/master/packages/adapter-vercel)

#### Node.js

シンプルな Node サーバーを作成するには、[`@sveltejs/adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) パッケージをインストールし、`svelte.config.js` を更新します:

```diff
/// file: svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from '@sveltejs/adapter-node';
```

With this, `vite build` will generate a self-contained Node app inside the `build` directory. You can pass options to adapters, such as customising the output directory:

```diff
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
	kit: {
-		adapter: adapter()
+		adapter: adapter({ out: 'my-output-directory' })
	}
};
```

#### 静的サイト(Static sites)

ほとんどの adapter は、サイト内の [プリレンダリング可能な](/docs/page-options#prerender) ページについて、静的な HTML を生成します。アプリ全体がプリレンダリング可能な場合は、[`@sveltejs/adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使用して _全ての_ ページ について静的な HTML を生成することができます。完全に静的なサイトは、[GitHub Pages](https://pages.github.com/) のような静的ホストなど、さまざまなプラットフォームでホストすることができます。

```diff
/// file: svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from '@sveltejs/adapter-static';
```

[fallback page](https://github.com/sveltejs/kit/tree/master/packages/adapter-static#spa-mode) を指定すれば、`adapter-static` を使用してシングルページアプリ(SPA)を生成することができます。

> SvelteKit をデプロイする環境に対して [`trailingSlash`](configuration#trailingslash) が適切に設定されているかよく確かめてください。`/a` に対するリクエストを受け取っても `/a.html` をレンダリングしない環境の場合、`/a.html` の代わりに `/a/index.html` を生成するために `trailingSlash: 'always'` を設定する必要があります。

#### プラットフォーム固有の情報

adapter によっては、リクエストに関する追加情報にアクセスすることができます。例えば、Cloudflare Workers の場合は KV namespaces などを含む `env` オブジェクトにアクセスできます。これは [hooks](/docs/hooks) や [エンドポイント(endpoints)](/docs/routing#endpoints) で使用される `RequestEvent` に、`platform` プロパティとして渡されます — 詳しくは、各 adapter のドキュメントをご参照ください。

### コミュニティが提供する adapter

加えて、他のプラットフォーム向けに、[コミュニティによって提供されている adapter](https://sveltesociety.dev/components#adapters) もございます。パッケージマネージャーで該当の adapter をインストールした後、`svelte.config.js` を更新してください:

```diff
/// file: svelte.config.js
-import adapter from '@sveltejs/adapter-auto';
+import adapter from 'svelte-adapter-[x]';
```

### custom adapter を作成する

似ているプラットフォーム向けの [adapter のソースを探し](https://github.com/sveltejs/kit/tree/master/packages)、それをコピーするところから始めることを推奨します。

Adapter Package は `Adapter` を作成する以下の API を実装する必要があります:

```js
// @filename: ambient.d.ts
const AdapterSpecificOptions = any;

// @filename: index.js
// ---cut---
/** @param {AdapterSpecificOptions} options */
export default function (options) {
	/** @type {import('@sveltejs/kit').Adapter} */
	const adapter = {
		name: 'adapter-package-name',
		async adapt(builder) {
			// adapter implementation
		}
	};

	return adapter;
}
```

`Adapter` とそのパラメータの型は [types/config.d.ts](https://github.com/sveltejs/kit/blob/master/packages/kit/types/config.d.ts) にあります。

`adapt` メソッドの中では、adapter がすべきことがたくさんあります:

- Clear out the build directory
- Write SvelteKit output with `builder.writeClient`, `builder.writeServer`, and `builder.writePrerendered`
- Output code that:
  - Imports `Server` from `${builder.getServerDirectory()}/index.js`
  - Instantiates the app with a manifest generated with `builder.generateManifest({ relativePath })`
  - Listens for requests from the platform, converts them to a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) if necessary, calls the `server.respond(request, { getClientAddress })` function to generate a [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) and responds with it
  - expose any platform-specific information to SvelteKit via the `platform` option passed to `server.respond`
  - Globally shims `fetch` to work on the target platform, if necessary. SvelteKit provides a `@sveltejs/kit/install-fetch` helper for platforms that can use `node-fetch`
- Bundle the output to avoid needing to install dependencies on the target platform, if necessary
- Put the user's static files and the generated JS/CSS in the correct location for the target platform

可能であれば、adapter の出力は `build/` ディレクトリに、中間出力は `.svelte-kit/[adapter-name]` に置くことを推奨します。

> adapter API はバージョン 1.0 のリリース前に変更される可能性があります。
