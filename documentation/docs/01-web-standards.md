---
title: Web standards
---

このドキュメントを通じて、SvelteKit の土台となっている標準の [Web API](https://developer.mozilla.org/en-US/docs/Web/API) を参照することができます。私たちは車輪の再発明をするのではなく、_プラットフォームを使用します_ 。つまり、既存の Web 開発スキルが SvelteKit にも活用できるということです。逆に言えば、SvelteKit の学習に時間を割くことは、あなたが他の場所でも通用する良い Web 開発者になるのに役立つでしょう。

これらの API は、全てのモダンブラウザはもちろん、Cloudflare Workers、Deno、Vercel Edge Functions といったブラウザ以外の環境でも使用することができます。開発中や、(AWS Lambda を含む) Node ベースの環境向けの [adapters](/docs/adapters) では、必要に応じて polyfill で利用できるようにしています (現時点においては。Node は急速により多くの Web 標準のサポートを追加しています)。

具体的には、以下のことが楽にできるでしょう:

### Fetch APIs

SvelteKit は、ネットワーク越しにデータを取得するために [`fetch`](https://developer.mozilla.org/ja/docs/Web/API/fetch) を使用します。ブラウザだけでなく、[hooks](/docs/hooks) や [エンドポイント(endpoint)](/docs/routing#endpoints) の中でも使用することができます。

> A special version of `fetch` is available in [`load`](/docs/loading) functions for invoking endpoints directly during server-side rendering, without making an HTTP call, while preserving credentials. (To make credentialled fetches in server-side code outside `load`, you must explicitly pass `cookie` and/or `authorization` headers.) It also allows you to make relative requests, whereas server-side `fetch` normally requires a fully qualified URL.

`fetch` 自体の他に、[Fetch API](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API) には以下のインターフェイスが含まれています:

#### Request

[`Request`](https://developer.mozilla.org/ja/docs/Web/API/Request) のインスタンスは [hooks](/docs/hooks) や [エンドポイント(endpoint)](/docs/routing#endpoints) で `event.request` という形でアクセスすることができます。これには `request.json()` や `request.formData()` など、例えばエンドポイントに送られたデータを取得するための便利なメソッドが含まれています。

#### Response

[`Response`](https://developer.mozilla.org/ja/docs/Web/API/Response) のインスタンスは `await fetch(...)` から返されます。本質的には、SvelteKit アプリは `Request` を `Response` に変換するマシンです。

#### Headers

[`Headers`](https://developer.mozilla.org/ja/docs/Web/API/Headers) インターフェイスでは、SvelteKit が受信した `request.headers` を読むことと、送信する `response.headers` をセットすることができます:

```js
// @errors: 2461
/// file: src/routes/what-is-my-user-agent.js
/** @type {import('@sveltejs/kit').RequestHandler} */
export function get(event) {
	// log all headers
	console.log(...event.request.headers);

	return {
		body: {
			// retrieve a specific header
			userAgent: event.request.headers.get('user-agent')
		}
	};
}
```

### URL APIs

URL は [`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) インターフェイスで表現され、`origin` や `pathname` のような便利なプロパティが含まれています (ブラウザでは `hash` なども)。このインターフェイスは、[hooks](/docs/hooks) と [エンドポイント(endpoints)](/docs/routing#endpoints) では `event.url`、[ページ(pages)](/docs/routing#pages) では [`$page.url`](/docs/modules#$app-stores)、[`beforeNavigate` と `afterNavigate`](/docs/modules#$app-navigation) では `from` と `to`、など、様々な場所で使われています。

#### URLSearchParams

URL が存在する場所であれば、[`URLSearchParams`](https://developer.mozilla.org/ja/docs/Web/API/URLSearchParams) のインスタンスである `url.searchParams` を使用してクエリパラメータにアクセスできます:

```js
// @filename: ambient.d.ts
declare global {
	const url: URL;
}

export {};

// @filename: index.js
// ---cut---
const foo = url.searchParams.get('foo');
```

### Web Crypto

The [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) is made available via the `crypto` global. It's used internally for [Content Security Policy](/docs/configuration#csp) headers, but you can also use it for things like generating UUIDs:

```js
const uuid = crypto.randomUUID();
```
