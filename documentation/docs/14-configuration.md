---
title: Configuration
---

プロジェクトの設定は `svelte.config.js` ファイルにあります。全ての値はオプションです。オプションのデフォルトと完全なリストはこちらです:

```js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	// options passed to svelte.compile (https://svelte.dev/docs#svelte_compile)
	compilerOptions: null,

	// an array of file extensions that should be treated as Svelte components
	extensions: ['.svelte'],

	kit: {
		adapter: null,
		amp: false,
		appDir: '_app',
		files: {
			assets: 'static',
			hooks: 'src/hooks',
			lib: 'src/lib',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			template: 'src/app.html'
		},
		floc: false,
		headers: {
			host: null,
			protocol: null
		},
		host: null,
		hydrate: true,
		package: {
			dir: 'package',
			emitTypes: true,
			// excludes all .d.ts and files starting with _ as the name
			exports: (filepath) => !/^_|\/_|\.d\.ts$/.test(filepath),
			files: () => true
		},
		paths: {
			assets: '',
			base: ''
		},
		prerender: {
			concurrency: 1,
			crawl: true,
			enabled: true,
			entries: ['*'],
			onError: 'fail'
		},
		protocol: null,
		router: true,
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_STORE/.test(filepath)
		},
		ssr: true,
		target: null,
		trailingSlash: 'never',
		vite: () => ({})
	},

	// SvelteKit uses vite-plugin-svelte. Its options can be provided directly here.
	// See the available options at https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md

	// options passed to svelte.preprocess (https://svelte.dev/docs#svelte_preprocess)
	preprocess: null
};

export default config;
```

### adapter

`svelte-kit build` を実行するのに必要で、異なるプラットフォーム向けにアウトプットがどのように変換されるかを決定します。[アダプター(Adapters)](#adapters) をご参照ください。

### amp

[AMP](#amp) モードを有効にします。

### appDir

ビルドされたJSとCSS(およびインポートされたアセット)が提供される `paths.assets` からの相対ディレクトリ(ファイル名にはコンテンツベースのハッシュが含まれており、つまり、無期限にキャッシュすることができます)。先頭または末尾が `/` であってはいけません。

### files

以下の `string` 値のうち、0個以上を含むオブジェクトです:

- `assets` — `favicon.ico` or `manifest.json` のような、何も処理する必要もなく、安定したURLを持つべき静的ファイルを配置する場所
- `hooks` — hooks モジュールのロケーション([Hooks](#hooks) をご参照ください)
- `lib` — コードベース全体から `$lib` でアクセスできる、アプリの内部ライブラリ
- `routes` — アプリの構造を定義するファイル([Routing](#routing) をご参照ください)
- `serviceWorker` — サービスワーカーのエントリーポイントのロケーション([Service workers](#service-workers) をご参照ください)
- `template` — HTMLレスポンス用テンプレートのロケーション

### floc

Google の [FLoC](https://github.com/WICG/floc) は、[Electronic Frontier Foundation](https://www.eff.org/) がユーザーのプライバシーに[害を及ぼす](https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea)と判断したターゲティング広告のテクノロジーです。[Chrome以外のブラウザ](https://www.theverge.com/2021/4/16/22387492/google-floc-ad-tech-privacy-browsers-brave-vivaldi-edge-mozilla-chrome-safari) は実装を断わりました。

[GitHub Pages](https://github.blog/changelog/2021-04-27-github-pages-permissions-policy-interest-cohort-header-added-to-all-pages-sites/) などのサービスと同様に、SvelteKit は自動的に FLoC をオプトアウトすることでユーザーを保護します。`floc` を `true` にしない限り、レスポンスに以下のヘッダを追加します:

```
Permissions-Policy: interest-cohort=()
```

> これはサーバーレンダリングされたレスポンスにのみ適用されます — プリレンダリングされたページ(例えば [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) によって作成されたページ) のヘッダは、ホスティングプラットフォームによって決定されます。

### headers

特定の環境においては、現在のページまたはエンドポイントの `url` は、リクエストのプロトコル(通常は `https`) とホスト(デフォルトでは `Host` ヘッダから取得される)から得られます。

もしアプリがリバースプロキシ(ロードバランサーやCDN)の背後にある場合、`Host` ヘッダは不正確です。ほとんどの場合、基となるプロトコルとホストは [`X-Forwarded-Host`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Host) ヘッダと [`X-Forwarded-Proto`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-Proto) ヘッダ経由で公開されますが、これは設定で指定することができます:

```js
// svelte.config.js
export default {
	kit: {
		headers: {
			host: 'X-Forwarded-Host',
			protocol: 'X-Forwarded-Proto'
		}
	}
};
```

**リバースプロキシーを信頼できる場合にのみこれを行ってください**。これがデフォルトでない理由です。

### host

この値は [`config.kit.headers.host`](#configuration-headers-host) から得られる値よりも優先されます。

### hydrate

サーバーでレンダリングされたHTMLをクライアントサイドのアプリで [ハイドレート(hydrate)](#ssr-and-javascript-hydrate) するかどうか (アプリ全体でこれを  `false` に設定することはごく稀でしょう)。

### package

[パッケージ作成](#packaging) に関連するオプションです。

- `dir` - 出力ディレクトリ
- `emitTypes` - デフォルトでは、`svelte-kit package` は自動的にパッケージの型を `.d.ts` ファイル形式で生成します。型の生成は設定で変更できますが、常に型を生成することがエコシステムの品質にとってベストであると私たちは信じています。`false` に設定するときは、十分な理由があることを確認してください(例えば、代わりに手書きの型定義を提供したい場合など)
- `exports` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、ファイルパスが `package.json` の `exports` フィールドに含まれるようになります。`package.json` のソースにある既存の値は、オリジナルの `exports` フィールドの値が優先されてマージされます
- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、ファイルは処理され、`dir` で指定された最終的な出力フォルダにコピーされます

高度な `filepath` マッチングには、`exports` と `files` オプションを globbing ライブラリと組み合わせて使用することができます:

```js
// svelte.config.js
import mm from 'micromatch';

export default {
	kit: {
		package: {
			exports: (filepath) => {
				if (filepath.endsWith('.d.ts')) return false;
				return mm.isMatch(filepath, ['!**/_*', '!**/internal/**']);
			},
			files: mm.matcher('!**/build.*')
		}
	}
};
```

### paths

以下の `string` 値のうち、0個以上を含むオブジェクトです:

- `assets` — アプリのファイルが提供される絶対パス。これは、何らかのストレージバケットからファイルを提供する場合に便利です
- `base` — 先頭が `/` で、末尾は `/` であってはならないルート相対パス(例 `/base-path`)。これはアプリがどこから提供されるかを指定し、これによってアプリを非ルートパスで動作させることができます

### prerender

[プリレンダリング(Prerendering)](#ssr-and-javascript-prerender) をご参照ください。以下の `string` 値のうち、0個以上を含むオブジェクトです:

- `concurrency` — 同時にいくつのページをプリレンダリングできるか。JS はシングルスレッドですが、プリレンダリングのパフォーマンスがネットワークに縛られている場合(例えば、リモートのCMSからコンテンツをロードしている場合)、ネットワークの応答を待っている間に他のタスクを処理することで高速化することができます
- `crawl` — SvelteKitがシードページからリンクをたどってプリレンダリングするページを見つけるかどうかを決定します
- `enabled` — `false` に設定すると、プリレンダリングを完全に無効化できます
- `entries` — プリレンダリングするページ、またはクロールを開始するページ(`crawl: true` の場合)の配列。`*` 文字列には、全ての動的ではないルート(routes)(すなわち `[parameters]` を含まないページ) が含まれます
- `onError`

  - `'fail'` — (デフォルト) リンクをたどったときにルーティングエラーが発生した場合、ビルドを失敗させます
  - `'continue'` — ルーティングエラーが発生しても、ビルドを継続させます
  - `function` — カスタムエラーハンドラにより、ログを記録したり、`throw` してビルドを失敗させたり、クロールの詳細に基づいて任意の他のアクションを実行したりすることができます

    ```ts
    import adapter from '@sveltejs/adapter-static';
    /** @type {import('@sveltejs/kit').PrerenderErrorHandler} */
    const handleError = ({ status, path, referrer, referenceType }) => {
    	if (path.startsWith('/blog')) throw new Error('Missing a blog page!');
    	console.warn(`${status} ${path}${referrer ? ` (${referenceType} from ${referrer})` : ''}`);
    };

    export default {
    	kit: {
    		adapter: adapter(),
    		target: '#svelte',
    		prerender: {
    			onError: handleError
    		}
    	}
    };
    ```

### protocol

[`config.kit.headers.protocol`](#configuration-headers-protocol) が設定されていない限り、プロトコルは `'https'` であると仮定されます(ローカルで `--https` フラグなしで開発していない限り)。必要であれば、ここでオーバーライドできます。

### router

アプリ全体で、クライアントサイドの [ルーター(router)](#ssr-and-javascript-router) を有効または無効にします。

### serviceWorker

以下の値のうち、0個以上を含むオブジェクトです:

- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、与えられたファイルが `$service-worker.files` で利用可能になります。それ以外の場合は除外されます。

### ssr

アプリ全体で、[サーバーサイドレンダリング(server-side rendering)](#ssr-and-javascript-ssr) を有効または無効にします。

### target

アプリをマウントする要素を指定します。テンプレートファイルに存在する要素を一意に指定する DOM セレクタでなければなりません。未指定の場合、アプリは `document.body` にマウントされます。

### trailingSlash

URL をルート(routes)に解決する際に、末尾のスラッシュ(trailing slashes)を削除するか、追加するか、無視するかどうかを指定します。

- `"never"` — `/x/` を `/x` にリダイレクトします
- `"always"` — `/x` を `/x/` にリダイレクトします
- `"ignore"` — 末尾のスラッシュを自動で追加したり削除したりしません。`/x` と `/x/` は同等に扱われます

> 末尾のスラッシュを無視することは推奨されません — 相対パスのセマンティクスが異なるため(`/x` からの `./y` は `/y` となりますが、`/x/` からは `/x/y` となります)、`/x` と `/x/` は別のURLとして扱われるので SEO に悪影響を及ぼします。もしこのオプションを使用する場合は、[`handle`](#hooks-handle) 関数の中で `request.path` に末尾のスラッシュを条件に応じて追加または削除するロジックを確実に実装してください。

### vite

[Vite のコンフィグオブジェクト](https://vitejs.dev/config) か、またはそれを返す関数を指定します。[Vite と Rollup のプラグイン](https://github.com/vitejs/awesome-vite#plugins)を [`plugins` オプション](https://vitejs.dev/config/#plugins) 経由で渡すことができ、イメージ最適化、Tauri、WASM、Workboxなどのサポートなど、高度な方法でビルドをカスタマイズすることができます。SvelteKit が特定の設定値に依存しているため、特定のビルドに関連しているオプションを設定することはできません。
