---
title: Page options
---

デフォルトでは、SvelteKit はどのコンポーネントも最初はサーバーでレンダリング (または [プリレンダリング](/docs/appendix#prerendering)) し、それを HTML としてクライアントに送信します。その後、ブラウザ上でコンポーネントを再度レンダリングし、**ハイドレーション(hydration)** と呼ばれるプロセスでそれをインタラクティブなものにします。このため、コンポーネントが両方の場所で実行できることを確認する必要があります。SvelteKit はそれから [**router**](/docs/routing) を初期化し、その後のナビゲーションを引き継ぎます。

これらはそれぞれオプションを [`+page.js`](/docs/routing#page-page-js) や [`+page.server.js`](/docs/routing#page-page-server-js) からエクスポートすることでページごとに、または共有の [`+layout.js`](/docs/routing#layout-layout-js) や [`+layout.server.js`](/docs/routing#layout-layout-server-js) を使用してページグループごとに制御することが可能です。アプリ全体に対してオプションを定義するには、最上位のレイアウト(root layout)からそれをエクスポートします。子レイアウトとページは親レイアウトで設定された値を上書きするため、例えば、プリレンダリングをアプリ全体で有効にし、それから動的にレンダリングする必要があるページではそれを無効にすることができます。

### prerender

あなたのアプリの、少なくともいくつかのルートは、ビルド時に生成されるシンプルな HTML ファイルとして表現されることが多いでしょう。これらのルート(routes)を [_プリレンダリング_](/docs/appendix#prerendering) することができます。

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = true;
```

代わりに、`export const prerender = true` を最上位(root)の `+layout.js` または `+layout.server.js` に設定し、明示的にプリレンダリングしないものとしてマークされたページを除き、全てをプリレンダリングできます:

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = false;
```

`prerender = true` があるルート(routes)は動的な SSR を行うのに使用する manifest から除外されるため、サーバー (または serverless/edge functions) を小さくすることができます。場合によっては、ルート(route)をプリレンダリングしつつ、manifest にも含めたいことがあるでしょう (例えば、`/blog/[slug]` のようなルート(route)があり、最も新しい/人気のあるコンテンツはプリレンダリングしたいがめったにアクセスされないものはサーバーでレンダリングしたい、など)。こういったケースのために、3つ目のオプションがあります、'auto' です:

```js
/// file: +page.js/+page.server.js/+server.js
export const prerender = 'auto';
```

> もしアプリ全体がプリレンダリングに適している場合は、[`adapter-static`](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) を使うことで、任意の静的 Web サーバーで使用するのに適したファイルを出力することができます。

プリレンダラはアプリの最上位(root)から開始され、プリレンダリング可能なページや `+server.js` ルート(routes)を見つけると、そのファイルを生成します。各ページは、プリレンダリングの候補である他のページを指し示す `<a>` 要素を見つけるためにスキャンされます。このため、通常はどのページにアクセスすべきか指定する必要はありません。もしプリレンダラがアクセスするページを指定する必要がある場合は、[prerender configuration](/docs/configuration#prerender) の `entries` オプションでこれを指定することができます。

#### Prerendering server routes

他のページオプションとは違い、`prerender` は `+server.js` ファイルにも適用できます。これらのファイルはレイアウトから影響を受けませんが、そこからデータを読み込むページからデフォルトの値を継承します。例えば、`+page.js` がこの `load` 関数を含む場合…

```js
/// file: +page.js
export const prerender = true;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const res = await fetch('/my-server-route.json');
	return await res.json();
}
```

…それから `src/routes/my-server-route.json/+server.js` は、自身の `export const prerender = false` を含んでいなければ、プリレンダリング可能であると扱われることになります。

#### プリレンダリングしない場合

基本的なルールは次の通りです: ページがプリレンダリング可能であると言うためには、そのページを直接表示する2人のユーザーが、サーバーから同じコンテンツを取得できなけれなりません。

> 全てのページがプリレンダリングに適しているわけではありません。プリレンダリングされたコンテンツは全てのユーザーに表示されます。もちろん、プリレンダリングされたページの `onMount` でパーソナライズされたデータをフェッチできますが、ブランクの初期コンテンツやローディングインジケーターにより、ユーザエクスペリエンスが低下してしまう可能性があります。

`src/routes/blog/[slug]/+page.svelte` ルート(route)のような、ページのパラメータを元にデータをロードするページもプリレンダリングができることにご注意ください。

プリレンダリング中に [`url.searchParams`](/docs/load#input-properties-url) にアクセスすることは禁止されています。もし使う必要があるなら、ブラウザの中だけで行うようにしてください (例えば `onMount` の中で)。

#### ルートの衝突(Route conflicts)

プリレンダリングはファイルシステムに書き込むため、ディレクトリとファイルが同じ名前になるエンドポイントを2つ持つことはできません。例えば、`src/routes/foo/+server.js` と `src/routes/foo/bar/+server.js` の場合は、`foo` と `foo/bar` を作成しようとしますが、これは不可能です。

このため(他にも理由はありますが)、常に拡張子を付けておくことを推奨します — `src/routes/foo.json/+server.js` と `src/routes/foo/bar.json/+server.js` は、`foo.json` と `foo/bar.json` ファイルが並んで調和して共存できます。

ページの場合は、`foo` ではなく `foo/index.html` を書き込むことでこの問題を回避しています。

ルーターがすでにアクティブかどうかにかかわらず、このページからのすべてのナビゲーションでクライアントサイドルーティングが無効になることにご注意ください。

### ssr

通常、SvelteKit ではページを最初にサーバーでレンダリングし、その HTML をクライアントに送信してハイドレーションを行います。もし `ssr` を `false` に設定した場合、代わりに空の 'shell' ページがレンダリングされます。これはページがサーバーでレンダリングできない場合には便利ですが、ほとんどの状況では推奨されません ([appendix をご参照ください](/docs/appendix#ssr))。

```js
/// file: +page.js
export const ssr = false;
```

### csr

通常、SvelteKit はサーバーでレンダリングされた HTML を、クライアントサイドレンダリング(CSR)されたインタラクティブなページに [ハイドレーション](/docs/appendix#hydration) します。JavaScript を全く必要としないページもあります。多くのブログ記事や 'about' ページがこのカテゴリに入ります。このような場合は CSR を無効にすることができます:

```js
/// file: +page.js
export const csr = false;
```

> `ssr` to `csr` の両方が `false` である場合は、何もレンダリングされません。
