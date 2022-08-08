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
		alias: {},
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
		env: {
			publicPrefix: 'PUBLIC_'
		},
		files: {
			assets: 'static',
			hooks: 'src/hooks',
			lib: 'src/lib',
			params: 'src/params',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			template: 'src/app.html'
		},
		inlineStyleThreshold: 0,
		methodOverride: {
			parameter: '_method',
			allowed: []
		},
		moduleExtensions: ['.js', '.ts'],
		outDir: '.svelte-kit',
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
			default: false,
			enabled: true,
			entries: ['*'],
			onError: 'fail',
			origin: 'http://sveltekit-prerender'
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
		}
	},

	// options passed to svelte.preprocess (https://svelte.dev/docs#compile-time-svelte-preprocess)
	preprocess: null
};

export default config;
```

### adapter

`vite build` の実行中に実行され、異なるプラットフォーム向けにアウトプットがどのように変換されるかを決定します。[Adapters](/docs/adapters) をご参照ください。

### alias

`import` 文の値を置き換えるのに使用される 0 個以上のエイリアスを含むオブジェクトです。これらのエイリアスは自動的に Vite と TypeScript に渡されます。

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		alias: {
			// this will match a file
			'my-file': 'path/to/my-file.js',

			// this will match a directory and its contents
			// (`my-directory/x` resolves to `path/to/my-directory/x`)
			'my-directory': 'path/to/my-directory',

			// an alias ending /* will only match
			// the contents of a directory, not the directory itself
			'my-directory/*': 'path/to/my-directory/*'
		}
	}
};
```

> ビルトインの `$lib` エイリアスはパッケージングで使用されるため、`config.kit.files.lib` でコントロールされています。

### appDir

ビルドされた JS と CSS(およびインポートされたアセット)が提供される `paths.assets` からの相対ディレクトリ(ファイル名にはコンテンツベースのハッシュが含まれており、つまり、無期限にキャッシュすることができます)。先頭または末尾が `/` であってはいけません。

### browser

以下の `boolean` 値のうち、0 個以上を含むオブジェクトです:

- `hydrate` — サーバーでレンダリングされた HTML をクライアントサイドのアプリで [ハイドレート(hydrate)](/docs/page-options#hydrate) するかどうかを指定します。(アプリ全体でこれを `false` に設定することはめったにありません)
- `router` — クライアントサイドの[ルーター(router)](/docs/page-options#router)をアプリ全体で有効または無効にします。

### csp

以下の値のうち、0 個以上を含むオブジェクトです:

- `mode` — 'hash'、'nonce'、'auto' のいずれか
- `directives` — `[directive]: value[]` ペアのオブジェクト 
- `reportOnly` — CSP report-only モードのための `[directive]: value[]` ペアのオブジェクト 

[Content Security Policy](https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Content-Security-Policy) の設定です。CSP は、リソースの読み込み元を制限することにより、クロスサイトスクリプティング (XSS) 攻撃からユーザーを守るのに役立ちます。例えば、このような設定では…

```js
/// file: svelte.config.js
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		csp: {
			directives: {
				'script-src': ['self']
			},
			reportOnly: {
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

> ほとんどの [Svelte transitions](https://svelte.jp/tutorial/transition) は、インラインの `<style>` 要素を作成することで動作することにご注意ください。これらをアプリで使用する場合、`style-src` ディレクティブを指定しないようにするか、`unsafe-inline` を追加する必要があります。

### env

環境変数の設定です:

- `publicPrefix` — クライアントサイドのコードに公開しても安全であることを示す接頭辞です。[`$env/static/public`](/docs/modules#$env-static-public) と [`$env/dynamic/public`](/docs/modules#$env-dynamic-public) をご参照ください。Vite の環境変数のハンドリングを使用する場合は、Vite の [`envPrefix`](https://ja.vitejs.dev/config/shared-options.html#envprefix) を別途設定する必要があることにご注意ください。もっとも、通常はこの機能を使用する必要はありません。

### files

以下の `string` 値のうち、0 個以上を含むオブジェクトです:

- `assets` — `favicon.ico` or `manifest.json` のような、何も処理する必要もなく、安定した URL を持つべき静的ファイルを配置する場所
- `hooks` — hooks モジュールのロケーション([Hooks](/docs/hooks) をご参照ください)
- `lib` — コードベース全体から `$lib` でアクセスできる、アプリの内部ライブラリ
- `params` — [parameter matchers](/docs/routing#advanced-routing-matching) を含むディレクトリ
- `routes` — アプリの構造を定義するファイル([ルーティング](/docs/routing) をご参照ください)
- `serviceWorker` — Service Worker のエントリーポイントのロケーション([Service workers](/docs/service-workers) をご参照ください)
- `template` — HTML レスポンス用テンプレートのロケーション

### inlineStyleThreshold

CSS を HTML の先頭の `<style>` ブロック内にインライン化するかどうか。このオプションでは、インライン化する CSS ファイルの最大長を数値で指定します。ページに必要な CSS ファイルで、このオプションの値より小さいものはマージされ、`<style>` ブロックにインライン化されます。

> この結果、最初のリクエストが少なくなり、[First Contentful Paint](https://web.dev/first-contentful-paint) スコアを改善することができます。しかし、HTML 出力が大きくなり、ブラウザキャッシュの効果が低下します。慎重に使用してください。

### methodOverride

[HTTP Method Overrides](/docs/routing#endpoints-http-method-overrides) をご参照ください。以下のうち、0 個以上を含むオブジェクトです:

- `parameter` — 使いたいメソッドの値を渡すのに使用するクエリパラメータ名
- `allowed` - オリジナルのリクエストメソッドを上書きするときに使用することができる HTTP メソッドの配列

### moduleExtensions

SvelteKit がモジュールとして取り扱うファイル拡張子の配列です。`config.extensions` と `config.kit.moduleExtensions` のいずれにもマッチしない拡張子のファイルはルーター (router) から無視されます。

### outDir

SvelteKit が `dev` と `build` のときにファイルを書き込むディレクトリです。このディレクトリをバージョン管理から除外する必要があります。

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

以下の `string` 値のうち、0 個以上を含むオブジェクトです:

- `assets` — アプリのファイルが提供される絶対パス。これは、何らかのストレージバケットからファイルを提供する場合に便利です
- `base` — ルート相対パス。空文字以外を指定する場合、先頭は `/` で始めなければならず、末尾は `/` で終わってはいけません (例 `/base-path`)。アプリがどこから提供されるかを指定することで、アプリを非ルートパスで動作させることができます

### prerender

[プリレンダリング(Prerendering)](/docs/page-options#prerender) をご参照ください。以下のうち、0 個以上を含むオブジェクトです:

- `concurrency` — 同時にいくつのページをプリレンダリングできるか。JS はシングルスレッドですが、プリレンダリングのパフォーマンスがネットワークに縛られている場合(例えば、リモートの CMS からコンテンツをロードしている場合)、ネットワークの応答を待っている間に他のタスクを処理することで高速化することができます
- `crawl` — SvelteKit がシードページからリンクをたどってプリレンダリングするページを見つけるかどうかを決定します
- `default` — `true` に設定すると、`export const prerender = false` を含まないページをプリレンダリングします
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

- `origin` — プリレンダリング時の `url.origin` の値です。レンダリングされたコンテンツに含まれている場合に有用です。

### routes

`(filepath: string) => boolean` という関数で、どのファイルがルート(routes)を作成し、どれが [プライベートモジュール](/docs/routing#private-modules) として扱われるか決定します。

### serviceWorker

以下の値のうち、0 個以上を含むオブジェクトです:

- `register` - `false` を設定した場合、service worker の自動登録を無効にします。
- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、与えられたファイルが `$service-worker.files` で利用可能になります。それ以外の場合は除外されます。

### trailingSlash

URL を解決する際に、末尾のスラッシュ (trailing slashes) を削除するか、追加するか、無視するかどうかを指定します (これはページ (pages) にのみ適用され、エンドポイント (endpoints) には適用されないことにご注意ください)。

- `'never'` — `/x/` を `/x` にリダイレクトします
- `'always'` — `/x` を `/x/` にリダイレクトします
- `'ignore'` — 末尾のスラッシュを自動で追加したり削除したりしません。`/x` と `/x/` は同等に扱われます

このオプションは [プリレンダリング](/docs/page-options#prerender) にも影響します。もし `trailingSlash` が `always` なら、`/about` のようなルートは `about/index.html` ファイルを生成し、それ以外の場合は `about.html` を生成し、静的な web サーバーの規約に従います。

> 末尾のスラッシュを無視することは推奨されません — 相対パスのセマンティクスが異なるため(`/x` からの `./y` は `/y` となりますが、`/x/` からは `/x/y` となります)、`/x` と `/x/` は別の URL として扱われるので SEO に悪影響を及ぼします。もしこのオプションを使用する場合は、[`handle`](/docs/hooks#handle) 関数の中で `request.path` に末尾のスラッシュを条件に応じて追加または削除するロジックを確実に実装してください。

### version

以下の値のうち、0 個以上を含むオブジェクトです:

- `name` - 現在のアプリのバージョン文字列
- `pollInterval` - バージョンの変更をポーリングするインターバル(ミリ秒)

アプリが使用されているときにアプリの新しいバージョンをデプロイするとクライアントサイドのナビゲーションにバグが発生することがあります。次に開くページのコードがすでにロードされている場合、古いコンテンツがある可能性があります。そうでなくとも、アプリのルートマニフェストがもう存在しない JavaScript ファイルを指している可能性があります。SvelteKit は、ここで指定された `name` (デフォルトではビルドのタイムスタンプ) を使用して新しいバージョンがデプロイされたことを検知すると、従来のフルページナビゲーションにフォールバックすることにより、この問題を解決しています。

`pollInterval` を 0 以外の値に設定した場合、SvelteKit はバックグラウンドで新しいバージョンをポーリングし、それを検知すると [`updated`](/docs/modules#$app-stores) ストアの値を `true` にします。
