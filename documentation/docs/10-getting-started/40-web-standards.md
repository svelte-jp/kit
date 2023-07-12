---
title: Web standards
---

このドキュメントを通じて、SvelteKit の土台となっている標準の [Web API](https://developer.mozilla.org/en-US/docs/Web/API) を参照することができます。私たちは車輪の再発明をするのではなく、_プラットフォームを使用します_ 。つまり、既存の Web 開発スキルが SvelteKit にも活用できるということです。逆に言えば、SvelteKit の学習に時間を割くことは、あなたが他の場所でも通用する良い Web 開発者になるのに役立つでしょう。

これらの API は、全てのモダンブラウザはもちろん、Cloudflare Workers、Deno、Vercel Edge Functions といったブラウザ以外の環境でも使用することができます。開発中や、(AWS Lambda を含む) Node ベースの環境向けの [adapters](adapters) では、必要に応じて polyfill で利用できるようにしています (現時点においては。Node は急速により多くの Web 標準のサポートを追加しています)。

具体的には、以下のことが楽にできるでしょう:

## Fetch APIs

SvelteKit は、ネットワーク越しにデータを取得するために [`fetch`](https://developer.mozilla.org/ja/docs/Web/API/fetch) を使用します。ブラウザだけでなく、[hooks](hooks) や [サーバールート(server routes)](routing#server) の中でも使用することができます。

> [`load`](load) 関数、[server hooks](hooks#server-hooks)、[API routes](routing#server) の中では特別なバージョンの `fetch` を使用することができ、サーバーサイドレンダリング中に、HTTP をコールすることなく、クレデンシャルを保持したまま、直接エンドポイント(endpoints)を呼び出すことができます。(`load` の外側のサーバーサイドコードでクレデンシャル付きの fetch を行う場合は、明示的に `cookie` や `authorization` ヘッダーなどを渡さなければなりません。) また、通常のサーバーサイドの `fetch` では絶対パスの URL が必要となりますが、特別なバージョンの `fetch` では相対パスのリクエストが可能です。

`fetch` 自体の他に、[Fetch API](https://developer.mozilla.org/ja/docs/Web/API/Fetch_API) には以下のインターフェイスが含まれています:

### Request

[`Request`](https://developer.mozilla.org/ja/docs/Web/API/Request) のインスタンスは [hooks](hooks) や [サーバールート(server routes)](routing#server) で `event.request` という形でアクセスすることができます。これには `request.json()` や `request.formData()` など、エンドポイントに送られたデータを取得するための便利なメソッドが含まれています。

### Response

[`Response`](https://developer.mozilla.org/ja/docs/Web/API/Response) のインスタンスは `await fetch(...)` と `+server.js` ファイル内のハンドラーから返されます。本質的には、SvelteKit アプリは `Request` を `Response` に変換するマシンです。

### Headers

[`Headers`](https://developer.mozilla.org/ja/docs/Web/API/Headers) インターフェイスでは、受け取った `request.headers` を読み取り、送信する `response.headers` をセットすることができます。例えば以下のように、`request.headers` を取得して、[`json` という便利な関数](modules#sveltejs-kit-json)を使用して `response.headers` を変更し送信することができます:

```js
// @errors: 2461
/// file: src/routes/what-is-my-user-agent/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export function GET({ request }) {
	// log all headers
	console.log(...request.headers);

	// create a JSON Response using a header we received
	return json({
		// retrieve a specific header
		userAgent: request.headers.get('user-agent')
	}, {
		// set a header on the response
		headers: { 'x-custom-header': 'potato' }
	});
}
```

## FormData

HTML のネイティブのフォーム送信を扱う場合は、[`FormData`](https://developer.mozilla.org/ja/docs/Web/API/FormData) オブジェクトを使用します。

```js
// @errors: 2461
/// file: src/routes/hello/+server.js
import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	const body = await event.request.formData();

	// log all fields
	console.log([...body]);

	return json({
		// get a specific field's value
		name: body.get('name') ?? 'world'
	});
}
```

## Stream APIs

ほとんどの場合、エンドポイント(endpoints) は 上記の `userAgent` の例のように、完全なデータを返します。たまに、1度ではメモリに収まらない大きすぎるレスポンスを返したり、チャンクで配信したりしなければならないことがあります。このような場合のために、プラットフォームは [streams](https://developer.mozilla.org/ja/docs/Web/API/Streams_API) — [ReadableStream](https://developer.mozilla.org/ja/docs/Web/API/ReadableStream)、[WritableStream](https://developer.mozilla.org/ja/docs/Web/API/WritableStream)、[TransformStream](https://developer.mozilla.org/ja/docs/Web/API/TransformStream) を提供しています。

## URL APIs

URL は [`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) インターフェイスで表現され、`origin` や `pathname` のような便利なプロパティが含まれています (ブラウザでは `hash` なども)。このインターフェイスは、[hooks](hooks) と [サーバールート(server routes)](routing#server) では `event.url`、[ページ(pages)](routing#page) では [`$page.url`](modules#$app-stores)、[`beforeNavigate` と `afterNavigate`](modules#$app-navigation) では `from` と `to`、など、様々な場所で使われています。

### URLSearchParams

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

## Web Crypto

[Web Crypto API](https://developer.mozilla.org/ja/docs/Web/API/Web_Crypto_API) を、グローバルの `crypto` 経由で使用することができます。内部では [Content Security Policy](configuration#csp) ヘッダーで使用されていますが、例えば UUID を生成するのにもお使い頂けます。

```js
const uuid = crypto.randomUUID();
```
