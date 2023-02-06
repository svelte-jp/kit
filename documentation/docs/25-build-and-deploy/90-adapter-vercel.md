---
title: Vercel
---

Vercel にデプロイする場合は、[`adapter-vercel`](https://github.com/sveltejs/kit/tree/master/packages/adapter-vercel) を使用します。

[`adapter-auto`](adapter-auto) を使用している場合、この adapter は自動でインストールされますが、この adapter 自体をプロジェクトに追加すれば Vercel 固有のオプションを指定できるようになります。

## 使い方

`npm i -D @sveltejs/adapter-vercel` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		// default options are shown
		adapter: adapter({
			// if true, will deploy the app using edge functions
			// (https://vercel.com/docs/concepts/functions/edge-functions)
			// rather than serverless functions
			edge: false,

			// an array of dependencies that esbuild should treat
			// as external when bundling functions. this only applies
			// to edge functions, and should only be used to exclude
			// optional dependencies that will not run outside Node
			external: [],

			// if true, will split your app into multiple functions
			// instead of creating a single one for the entire app
			split: false
		})
	}
};
```

## 環境変数

Vercel では[デプロイメント固有の環境変数](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)一式を使用できます。他の環境変数と同様、`$env/static/private` と `$env/dynamic/private` からアクセスでき (詳細は後述)、public のほうからはアクセスできません。クライアントからこれらの変数にアクセスするには:

```js
// @errors: 2305
/// file: +layout.server.js
import { VERCEL_COMMIT_REF } from '$env/static/private';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
	return {
		deploymentGitBranch: VERCEL_COMMIT_REF
	};
}
```

```svelte
/// file: +layout.svelte
<script>
	/** @type {import('./$types').LayoutServerData} */
	export let data;
</script>

<p>This staging environment was deployed from {data.deploymentGitBranch}.</p>
```

Vercel でビルドする場合、これらの変数は全てビルド時と実行時で変わらないため、`$env/dynamic/private` ではなく、変数を静的に置換しデッドコードの削除などの最適化ができる `$env/static/private` の使用をおすすめします。`edge: true` にしてデプロイする場合は、`$env/static/private` を使用しなければなりません。`$env/dynamic/private` と `$env/dynamic/public` は、現在のところ Vercel の edge functions では設定されないためです。

## Notes

### Vercel functions

プロジェクトの root の `api` ディレクトリに Vercel functions がある場合、`/api/*` に対するリクエストは SvelteKit で処理されません。Vercel functions に JavaScript 以外の言語を使用する必要が無いのであれば、SvelteKit アプリの [API ルート(routes)](https://kit.svelte.jp/docs/routing#server) として実装すると良いでしょう。逆に Vercel functions に JavaScript 以外の言語を使用する必要がある場合は、SvelteKit アプリに `/api/*` ルート(routes)を含めないようにしてください。

### Node version

ある時期より前に作成されたプロジェクトはデフォルトで Node 14 を使用していますが、SvelteKit には Node 16 以降が必要です。[プロジェクトの設定で Node のバージョンを変更する](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-version)ことができます。

## トラブルシューティング

### ファイルシステムにアクセスする

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。
