---
title: Netlify
---

Netlify にデプロイする場合は、[`adapter-netlify`](https://github.com/sveltejs/kit/tree/master/packages/adapter-netlify) を使用します。

[`adapter-auto`](adapter-auto) を使用している場合、この adapter は自動でインストールされますが、この adapter 自体をプロジェクトに追加すれば Netlify 固有のオプションを指定できるようになります。

## 使い方 <!--usage-->

`npm i -D @sveltejs/adapter-netlify` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-netlify';

export default {
	kit: {
		// default options are shown
		adapter: adapter({
			// if true, will create a Netlify Edge Function rather
			// than using standard Node-based functions
			edge: false,

			// if true, will split your app into multiple functions
			// instead of creating a single one for the entire app.
			// if `edge` is true, this option cannot be used
			split: false
		})
	}
};
```

そして、プロジェクトの root に [netlify.toml](https://docs.netlify.com/configure-builds/file-based-configuration) ファイルを置くのを忘れないでください。このファイルの `build.publish` に基づいて静的なアセットをどこに書き込むか決定します。こちらのサンプルの設定をご覧ください:

```toml
[build]
	command = "npm run build"
	publish = "build"
```

`netlify.toml` ファイルが見つからない、もしくは `build.publish` の値が見つからない場合、`"build"` のデフォルト値が使用されます。Netlify の UI で publish ディレクトリを他の場所に設定する場合は、`netlify.toml` にも同じ場所を設定するか、`"build"` のデフォルト値を使用する必要があることにご注意ください。

### Node version

新しいプロジェクトではデフォルトで Node 16 が使用されます。しかし、少し前に作成したプロジェクトをアップグレードする場合、古いバージョンで止まってしまうかもしれません。手動で Node 16 以降を指定する場合、詳細は [Netlify のドキュメント](https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript)をご参照ください。

## Netlify Edge Functions

SvelteKit は [Netlify Edge Functions](https://docs.netlify.com/netlify-labs/experimental-features/edge-functions/) をサポートしています。`adapter` 関数に `edge: true` オプションを渡すと、サイト訪問者に近い場所にデプロイされる Deno ベースの edge function でサーバーサイドレンダリングが行われるようになります。`false` を設定した場合 (デフォルト)、サイトは Node ベースの Netlify Functions にデプロイされます。

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-netlify';

export default {
	kit: {
		adapter: adapter({
			// will create a Netlify Edge Function using Deno-based
			// rather than using standard Node-based functions
			edge: true
		})
	}
};
```

## SvelteKit の機能を代替する Netlify の機能 <!--netlify-alternatives-to-sveltekit-functionality-->

Netlify の機能に依存することなく、SvelteKit が直接提供する機能を使ってアプリを構築することができます。こういった機能は SvelteKit のほうを選択すると、開発モードでその機能を使用でき、インテグレーションテストが可能になり、Netlify から切り替えることになった場合に他の adapter で動作させることができます。しかし、シナリオによっては Netlify のほうの機能を使用したほうが有益な場合もあります。例えば、すでに Netlify でホストされているアプリを SvelteKit に移行する場合です。

### リダイレクトルール(Redirect rules)

コンパイル時に、リダイレクトルールは自動で `_redirects` ファイルに追記されます (もし存在しない場合は、作成されます)。つまり:

- `_redirects` のほうが[優先度が高い](https://docs.netlify.com/routing/redirects/#rule-processing-order)ため、`netlify.toml` にある `[[redirects]]` には決してマッチしません。そのため、ルールは常に [`_redirects` ファイル](https://docs.netlify.com/routing/redirects/#syntax-for-the-redirects-file)に記載してください。
- `_redirects` には、`/* /foobar/:splat` のようなカスタムの "catch all" ルールを置くべきではありません。そうしないと、自動で追加されたルールが適用されなくなります。Netlify は[最初にマッチしたルール](https://docs.netlify.com/routing/redirects/#rule-processing-order)だけを処理するからです。

### Netlify Forms

1. [こちら](https://docs.netlify.com/forms/setup/#html-forms)にあるように、例えば `/routes/contact/+page.svelte` に、Netlify HTML form を作成します。(hidden の `form-name` input 要素を追加するのを忘れずに！)
2. Netlify の build bot はデプロイ時にあなたの HTML ファイルをパースします。つまり、あなたの form は HTML として[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)されるようにしておかないといけません。あなたの `contact.svelte` に `export const prerender = true` を追加してそのページだけプリレンダリングするか、または `kit.prerender.force: true` オプションを設定して全てのページをプリレンダリングするようにしておくか、で対応できます。
3. あなたの Netlify form に `<form netlify ... action="/success">` のような[カスタムの成功メッセージ](https://docs.netlify.com/forms/setup/#success-messages)がある場合、それに対応する `/routes/success/+page.svelte` が存在しプリレンダリングされるか確認してください。

### Netlify Functions

この adapter によって、SvelteKit エンドポイントは [Netlify Functions](https://docs.netlify.com/functions/overview/) としてホストされます。Netlify function ハンドラには追加のコンテキストがあり、[Netlify Identity](https://docs.netlify.com/visitor-access/identity/) 情報が含まれています。このコンテキストは、あなたの hooks や `+page.server` と `+layout.server` エンドポイント の中で `event.platform.context` フィールドを介してアクセスできます。adapter config の `edge` プロパティが `false` の場合は[serverless functions](https://docs.netlify.com/functions/overview/)、`true` の場合は [edge functions](https://docs.netlify.com/edge-functions/overview/#app) となります。

```js
// @errors: 2705 7006
/// file: +page.server.js
export const load = async (event) => {
	const context = event.platform.context;
	console.log(context); // shows up in your functions log in the Netlify app
};
```

さらに、ディレクトリを追加して `netlify.toml` に設定を追加することで、独自の Netlify functions を追加することができます。例えば:

```toml
[build]
	command = "npm run build"
	publish = "build"

[functions]
	directory = "functions"
```

## トラブルシューティング <!--troubleshooting-->

### ファイルシステムにアクセスする <!--accessing-the-file-system-->

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。
