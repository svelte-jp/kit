---
title: Configuration
---

プロジェクトの設定は `svelte.config.js` ファイルにあります。全ての値はオプションです。オプションのデフォルトと完全なリストはこちらです:

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	// options passed to svelte.compile (https://svelte.dev/docs#compile-time-svelte-compile)
	compilerOptions: {},

	// an array of file extensions that should be treated as Svelte components
	extensions: ['.svelte'],

	kit: {
		adapter: undefined,
		amp: false,
		appDir: '_app',
		browser: {
			hydrate: true,
			router: true
		},
		csp: {
			mode: 'auto',
			directives: {
				'default-src': undefined
				// ...
			}
		},
		files: {
			assets: 'static',
			hooks: 'src/hooks',
			lib: 'src/lib',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			template: 'src/app.html'
		},
		floc: false,
		inlineStyleThreshold: 0,
		methodOverride: {
			parameter: '_method',
			allowed: []
		},
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
		routes: (filepath) => !/(?:(?:^_|\/_)|(?:^\.|\/\.)(?!well-known))/.test(filepath),
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},
		trailingSlash: 'never',
		version: {
			name: Date.now().toString(),
			pollInterval: 0
		},
		vite: () => ({})
	},

	// SvelteKit uses vite-plugin-svelte. Its options can be provided directly here.
	// See the available options at https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md

	// options passed to svelte.preprocess (https://svelte.dev/docs#compile-time-svelte-preprocess)
	preprocess: null
};

export default config;
```

### adapter

`svelte-kit build` を実行するのに必要で、異なるプラットフォーム向けにアウトプットがどのように変換されるかを決定します。[Adapters](/docs/adapters) をご参照ください。

### amp

[AMP](/docs/seo#amp) モードを有効にします。

### appDir

ビルドされたJSとCSS(およびインポートされたアセット)が提供される `paths.assets` からの相対ディレクトリ(ファイル名にはコンテンツベースのハッシュが含まれており、つまり、無期限にキャッシュすることができます)。先頭または末尾が `/` であってはいけません。

### browser

以下の `boolean` 値のうち、0個以上を含むオブジェクトです:

- `hydrate` — サーバーでレンダリングされた HTML をクライアントサイドのアプリで [ハイドレート(hydrate)](/docs/page-options#hydrate) するかどうかを指定します。(アプリ全体でこれを `false` に設定することはめったにありません)
- `router` — クライアントサイドの[ルーター(router)](/docs/page-options#router)をアプリ全体で有効または無効にします。

### csp

以下の値のうち、0個以上を含むオブジェクトです:

- `mode` — 'hash'、'nonce'、または 'auto'
- `directives` — `[directive]: value[]` ペアのオブジェクト

[Content Security Policy](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy) の設定です。CSP は、リソースの読み込み元を制限することにより、クロスサイトスクリプティング (XSS) 攻撃からユーザーを守るのに役立ちます。例えば、このような設定では…

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		csp: {
			directives: {
				'script-src': ['self']
			}
		}
	}
};

export default config;
```

…外部サイトからのスクリプト読み込みを防止します。SvelteKit は、生成されるインラインスタイルとスクリプトに対して、指定されたディレクティブを nonce か hash (`mode` の設定による) で補強します。

ページがプリレンダリングされる場合、CSP ヘッダーは `<meta http-equiv>` タグ経由で追加されます (この場合、`frame-ancestors`、`report-uri`、`sandbox` ディレクティブは無視されることにご注意ください)。

> `mode` が `'auto'` の場合、SvelteKit は動的にレンダリングされたページには nonce を、プリレンダリングされたページには hash を使用します。プリレンダリングされたページで nonce を使用するのは安全でないため、禁止されています。

### files

以下の `string` 値のうち、0個以上を含むオブジェクトです:

- `assets` — `favicon.ico` or `manifest.json` のような、何も処理する必要もなく、安定したURLを持つべき静的ファイルを配置する場所
- `hooks` — hooks モジュールのロケーション([Hooks](/docs/hooks) をご参照ください)
- `lib` — コードベース全体から `$lib` でアクセスできる、アプリの内部ライブラリ
- `routes` — アプリの構造を定義するファイル([ルーティング](/docs/routing) をご参照ください)
- `serviceWorker` — Service Worker のエントリーポイントのロケーション([Service workers](/docs/service-workers) をご参照ください)
- `template` — HTMLレスポンス用テンプレートのロケーション

### floc

Google の [FLoC](https://github.com/WICG/floc) は、[Electronic Frontier Foundation](https://www.eff.org/) がユーザーのプライバシーに[害を及ぼす](https://www.eff.org/deeplinks/2021/03/googles-floc-terrible-idea)と判断したターゲティング広告のテクノロジーです。[Chrome以外のブラウザ](https://www.theverge.com/2021/4/16/22387492/google-floc-ad-tech-privacy-browsers-brave-vivaldi-edge-mozilla-chrome-safari) は実装を断わりました。

[GitHub Pages](https://github.blog/changelog/2021-04-27-github-pages-permissions-policy-interest-cohort-header-added-to-all-pages-sites/) などのサービスと同様に、SvelteKit は自動的に FLoC をオプトアウトすることでユーザーを保護します。`floc` を `true` にしない限り、レスポンスに以下のヘッダを追加します:

```
Permissions-Policy: interest-cohort=()
```

> これはサーバーレンダリングされたレスポンスにのみ適用されます — プリレンダリングされたページ(例えば [adapter-static](https://github.com/sveltejs/kit/tree/master/packages/adapter-static) によって作成されたページ) のヘッダは、ホスティングプラットフォームによって決定されます。

### inlineStyleThreshold

CSS を HTML の先頭の `<style>` ブロック内にインライン化するかどうか。このオプションでは、インライン化するCSSファイルの最大長を数値で指定します。ページに必要な CSS ファイルで、このオプションの値より小さいものはマージされ、`<style>` ブロックにインライン化されます。

> この結果、最初のリクエストが少なくなり、[First Contentful Paint](https://web.dev/first-contentful-paint) スコアを改善することができます。しかし、HTML 出力が大きくなり、ブラウザキャッシュの効果が低下します。慎重に使用してください。

### methodOverride

[HTTP Method Overrides](/docs/routing#endpoints-http-method-overrides) をご参照ください。以下のうち、0個以上を含むオブジェクトです:

- `parameter` — 使いたいメソッドの値を渡すのに使用するクエリパラメータ名
- `allowed` - オリジナルのリクエストメソッドを上書きするときに使用することができる HTTP メソッドの配列

### package

[パッケージ作成](/docs/packaging) に関連するオプションです。

- `dir` - 出力ディレクトリ
- `emitTypes` - デフォルトでは、`svelte-kit package` は自動的にパッケージの型を `.d.ts` ファイル形式で生成します。型の生成は設定で変更できますが、常に型を生成することがエコシステムの品質にとってベストであると私たちは信じています。`false` に設定するときは、十分な理由があることを確認してください(例えば、代わりに手書きの型定義を提供したい場合など)
- `exports` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、ファイルパスが `package.json` の `exports` フィールドに含まれるようになります。`package.json` のソースにある既存の値は、オリジナルの `exports` フィールドの値が優先されてマージされます
- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、ファイルは処理され、`dir` で指定された最終的な出力フォルダにコピーされます

高度な `filepath` マッチングには、`exports` と `files` オプションを globbing ライブラリと組み合わせて使用することができます:

```js
// @filename: ambient.d.ts
declare module 'micromatch';

/// file: svelte.config.js
// @filename: index.js
// ---cut---
import mm from 'micromatch';

/** @type {import('@sveltejs/kit').Config} */
const config = {
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

export default config;
```

### paths

以下の `string` 値のうち、0個以上を含むオブジェクトです:

- `assets` — アプリのファイルが提供される絶対パス。これは、何らかのストレージバケットからファイルを提供する場合に便利です
- `base` — 先頭が `/` で、末尾は `/` であってはならないルート相対パス(例 `/base-path`)。これはアプリがどこから提供されるかを指定し、これによってアプリを非ルートパスで動作させることができます

### prerender

[プリレンダリング(Prerendering)](/docs/page-options#prerender) をご参照ください。以下のうち、0個以上を含むオブジェクトです:

- `concurrency` — 同時にいくつのページをプリレンダリングできるか。JS はシングルスレッドですが、プリレンダリングのパフォーマンスがネットワークに縛られている場合(例えば、リモートのCMSからコンテンツをロードしている場合)、ネットワークの応答を待っている間に他のタスクを処理することで高速化することができます
- `crawl` — SvelteKitがシードページからリンクをたどってプリレンダリングするページを見つけるかどうかを決定します
- `enabled` — `false` に設定すると、プリレンダリングを完全に無効化できます
- `entries` — プリレンダリングするページ、またはクロールを開始するページ(`crawl: true` の場合)の配列。`*` 文字列には、全ての動的ではないルート(routes)(すなわち `[parameters]` を含まないページ) が含まれます
- `onError`

  - `'fail'` — (デフォルト) リンクをたどったときにルーティングエラーが発生した場合、ビルドを失敗させます
  - `'continue'` — ルーティングエラーが発生しても、ビルドを継続させます
  - `function` — カスタムエラーハンドラにより、ログを記録したり、`throw` してビルドを失敗させたり、クロールの詳細に基づいて任意の他のアクションを実行したりすることができます

    ```js
    import adapter from '@sveltejs/adapter-static';

    /** @type {import('@sveltejs/kit').Config} */
    const config = {
    	kit: {
    		adapter: adapter(),
    		prerender: {
    			onError: ({ status, path, referrer, referenceType }) => {
    				if (path.startsWith('/blog')) throw new Error('Missing a blog page!');
    				console.warn(
    					`${status} ${path}${referrer ? ` (${referenceType} from ${referrer})` : ''}`
    				);
    			}
    		}
    	}
    };

    export default config;
    ```

### routes

`(filepath: string) => boolean` という関数で、どのファイルがルート(routes)を作成し、どれが [プライベートモジュール](/docs/routing#private-modules) として扱われるか決定します。

### serviceWorker

以下の値のうち、0個以上を含むオブジェクトです:

- `register` - `false` を設定した場合、service worker の自動登録を無効にします。
- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、与えられたファイルが `$service-worker.files` で利用可能になります。それ以外の場合は除外されます。

### trailingSlash

URL をルート(routes)に解決する際に、末尾のスラッシュ(trailing slashes)を削除するか、追加するか、無視するかどうかを指定します。

- `"never"` — `/x/` を `/x` にリダイレクトします
- `"always"` — `/x` を `/x/` にリダイレクトします
- `"ignore"` — 末尾のスラッシュを自動で追加したり削除したりしません。`/x` と `/x/` は同等に扱われます

このオプションは [プリレンダリング](/docs/page-options#prerender) にも影響します。もし `trailingSlash` が `always` なら、`/about` のようなルートは `about/index.html` ファイルを生成し、それ以外の場合は `about.html` を生成し、静的な web サーバーの規約に従います。

> 末尾のスラッシュを無視することは推奨されません — 相対パスのセマンティクスが異なるため(`/x` からの `./y` は `/y` となりますが、`/x/` からは `/x/y` となります)、`/x` と `/x/` は別のURLとして扱われるので SEO に悪影響を及ぼします。もしこのオプションを使用する場合は、[`handle`](/docs/hooks#handle) 関数の中で `request.path` に末尾のスラッシュを条件に応じて追加または削除するロジックを確実に実装してください。

### version

以下の値のうち、0個以上を含むオブジェクトです:

- `name` - 現在のアプリのバージョン文字列
- `pollInterval` - バージョンの変更をポーリングするインターバル(ミリ秒)

アプリが使用されているときにアプリの新しいバージョンをデプロイするとクライアントサイドのナビゲーションにバグが発生することがあります。次に開くページのコードがすでにロードされている場合、古いコンテンツがある可能性があります。そうでなくとも、アプリのルートマニフェストがもう存在しない JavaScript ファイルを指している可能性があります。SvelteKit は、ここで指定された `name` (デフォルトではビルドのタイムスタンプ) を使用して新しいバージョンがデプロイされたことを検知すると、従来のフルページナビゲーションにフォールバックすることにより、この問題を解決しています。

`pollInterval` を0以外の値に設定した場合、SvelteKit はバックグラウンドで新しいバージョンをポーリングし、それを検知すると [`updated`](/docs/modules#$app-stores) ストアの値を `true` にします。

### vite

[Vite のコンフィグオブジェクト](https://ja.vitejs.dev/config/) か、またはそれを返す関数を指定します。[Vite と Rollup のプラグイン](https://github.com/vitejs/awesome-vite#plugins)を [`plugins` オプション](https://ja.vitejs.dev/config/#plugins) 経由で渡すことができ、イメージ最適化、Tauri、WASM、Workboxなどのサポートなど、高度な方法でビルドをカスタマイズすることができます。SvelteKit が特定の設定値に依存しているため、特定のビルドに関連しているオプションを設定することはできません。
