---
title: Vercel
---

Vercel にデプロイする場合は、[`adapter-vercel`](https://github.com/sveltejs/kit/tree/master/packages/adapter-vercel) を使用します。

[`adapter-auto`](adapter-auto) を使用している場合、この adapter は自動でインストールされますが、この adapter 自体をプロジェクトに追加すれば Vercel 固有のオプションを指定できるようになります。

## 使い方 <!--usage-->

`npm i -D @sveltejs/adapter-vercel` を実行してインストールし、`svelte.config.js` にこの adapter を追加します:

```js
// @errors: 2307 2345
/// file: svelte.config.js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter({
			// 以下の 'デプロイメントの設定' セクションを参照
		})
	}
};
```

## デプロイメントの設定 <!--deployment-configuration-->

Vercel にルート(routes)を function としてデプロイする方法をコントロールするには、デプロイメントの設定を、上記に示すオプションか、`+server.js`、`+page(.server).js`、`+layout(.server).js` ファイルの中の [`export const config`](page-options#config) を使用して、行うことができます。

例えば、アプリの一部を [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions) としてデプロイして…

```js
/// file: about/+page.js
/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	runtime: 'edge'
};
```

…他の部分を [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions) としてデプロイすることができます (layout の内側の `config` は、すべての子ページに適用されます):

```js
/// file: admin/+layout.js
/** @type {import('@sveltejs/adapter-vercel').Config} */
export const config = {
	runtime: 'nodejs18.x'
};
```

以下のオプションはすべての function に適用されます:

- `runtime`: `'edge'`、`'nodejs16.x'`、`'nodejs18.x'`。デフォルトでは、プロジェクトの Node のバージョンに応じて adapter が `'nodejs16.x'` か `'nodejs18.x'` を選択します。プロジェクトの Node バージョンは Vercel のダッシュボードから設定することができます。
- `regions`: [edge network regions](https://vercel.com/docs/concepts/edge-network/regions) の配列 (serverless functions のデフォルトは `["iad1"]`) か、`runtime` が `edge` (デフォルト) の場合は `'all'` です。serverless functions の場合の複数の regions のサポートは Enterprise Plan のみです。
- `split`: `true` の場合、ルート(route)は個別の function としてデプロイされます。`split` を adapter レベルで `true` にする場合、すべてのルート(route)が個別の function としてデプロイされます。

加えて、以下のオプションは edge function に適用されます:
- `external`: esbuild が function をバンドルする際に外部(external)として扱う依存関係(dependencies)の配列です。Node の外側で実行されないオプションの依存関係(optional dependencies)を除外したいときにのみ使用してください

そして以下のオプションは serverless function に適用されます:
- `memory`: function で利用できるメモリ量です。デフォルトは `1024` Mb で、`128` Mb まで減らすことができます。また、Pro または Enterprise アカウントの場合は、`3008` Mb まで[増やす](https://vercel.com/docs/concepts/limits/overview#serverless-function-memory)ことができます。間隔は 64Mb 単位です。
- `maxDuration`: function の最大実行時間。デフォルトで、Hobby アカウントの場合は `10` 秒、Pro の場合は `60`、Enterprise の場合は `900` です。
- `isr`: Incremental Static Regeneration の設定、詳細は後述

function から特定の region のデータにアクセスする必要がある場合は、パフォーマンスを最適化するためそれと同じ region (またはその知覚) にデプロイすることをおすすめします。

## Incremental Static Regeneration

Vercel は [Incremental Static Regeneration](https://vercel.com/docs/concepts/incremental-static-regeneration/overview) (ISR) をサポートしており、これにより、プリレンダリングコンテンツが持つパフォーマンスとコストの利点と、ダイナミックレンダリングコンテンツが持つ柔軟性の両方を提供することができます。

ISR をルート(route)に追加するには、`config` オブジェクトに `isr` プロパティを含めます:

```js
/// file: blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '$env/static/private' {
	export const BYPASS_TOKEN: string;
}

// @filename: index.js
// ---cut---
import { BYPASS_TOKEN } from '$env/static/private';

export const config = {
	isr: {
		// キャッシュされたアセットが Serverless Function を呼び出して再生成されるまでの有効期限 (秒単位)。
		// 値に `false` を設定すると、無期限になります。
		expiration: 60,

		// URL で提供されるランダムな token で、アセットへのリクエストに 
		// __prerender_bypass=<token> cookie を用いることで、アセットのキャッシュされたバージョンを回避することができます。
		//
		// `GET` や `HEAD` リクエストに `x-prerender-revalidate: <token>` を付けると、アセットの再バリデート(re-validated)を強制することができます。
		bypassToken: BYPASS_TOKEN,

		// 有効なクエリパラメータのリストです。他のパラメータ (例えば utm tracking codes) は無視され、
		// コンテンツが不必要に再生成されないようにします
		allowQuery: ['search']
	}
};
```

`expiration` プロパティは必須で、その他は任意です。

## 環境変数 <!--environment-variables-->

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
<!--- file: +layout.svelte --->
<script>
	/** @type {import('./$types').LayoutServerData} */
	export let data;
</script>

<p>This staging environment was deployed from {data.deploymentGitBranch}.</p>
```

Vercel でビルドする場合、これらの変数は全てビルド時と実行時で変わらないため、`$env/dynamic/private` ではなく、変数を静的に置換しデッドコードの削除などの最適化ができる `$env/static/private` の使用をおすすめします。

## Notes

### Vercel functions

プロジェクトの root の `api` ディレクトリに Vercel functions がある場合、`/api/*` に対するリクエストは SvelteKit で処理されません。Vercel functions に JavaScript 以外の言語を使用する必要が無いのであれば、SvelteKit アプリの [API ルート(routes)](https://kit.svelte.jp/docs/routing#server) として実装すると良いでしょう。逆に Vercel functions に JavaScript 以外の言語を使用する必要がある場合は、SvelteKit アプリに `/api/*` ルート(routes)を含めないようにしてください。

### Node version

ある時期より前に作成されたプロジェクトはデフォルトで Node 14 を使用していますが、SvelteKit には Node 16 以降が必要です。[プロジェクトの設定で Node のバージョンを変更する](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js#node.js-version)ことができます。

## トラブルシューティング <!--troubleshooting-->

### ファイルシステムにアクセスする <!--accessing-the-file-system-->

Serverless/Edge 環境では、`fs.readFileSync` などのメソッドでファイルシステムにアクセスすることはできません。もしこのような方法でファイルにアクセスする必要がある場合、アプリのビルド中に[プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender)でこれを行ってください。例えば、ブログを持っていて、CMS でコンテンツを管理したくない場合、コンテンツをプリレンダリングし (またはコンテンツを取得するエンドポイントをプリレンダリングし)、新しいコンテンツを追加するたびにブログを再デプロイする必要があります。
