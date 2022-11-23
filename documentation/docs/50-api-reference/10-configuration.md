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
		csp: {
			mode: 'auto',
			directives: {
				'default-src': undefined
				// ...
			}
		},
		csrf: {
			checkOrigin: true
		},
		env: {
			dir: process.cwd(),
			publicPrefix: 'PUBLIC_'
		},
		files: {
			assets: 'static',
			hooks: {
				client: 'src/hooks.client',
				server: 'src/hooks.server'
			},
			lib: 'src/lib',
			params: 'src/params',
			routes: 'src/routes',
			serviceWorker: 'src/service-worker',
			appTemplate: 'src/app.html',
			errorTemplate: 'src/error.html'
		},
		inlineStyleThreshold: 0,
		moduleExtensions: ['.js', '.ts'],
		outDir: '.svelte-kit',
		paths: {
			assets: '',
			base: ''
		},
		prerender: {
			concurrency: 1,
			crawl: true,
			enabled: true,
			entries: ['*'],
			handleHttpError: 'fail',
			handleMissingId: 'fail',
			origin: 'http://sveltekit-prerender'
		},
		serviceWorker: {
			register: true,
			files: (filepath) => !/\.DS_Store/.test(filepath)
		},
		version: {
			name: Date.now().toString(),
			pollInterval: 0
		}
	},

	// options passed to @sveltejs/package
	package: {
		source: 'value of kit.files.lib, if available, else src/lib',
		dir: 'package',
		emitTypes: true,
		// excludes all .d.ts and files starting with _ as the name
		exports: (filepath) => !/^_|\/_|\.d\.ts$/.test(filepath),
		files: () => true
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

> SvelteKit が必要なエイリアス設定を `jsconfig.json` または `tsconfig.json` に自動的に生成するためには、`npm run dev` を実行する必要があります。

### appDir

ビルドされた JS と CSS(およびインポートされたアセット)が提供される `paths.assets` からの相対ディレクトリ(ファイル名にはコンテンツベースのハッシュが含まれており、つまり、無期限にキャッシュすることができます)。先頭または末尾が `/` であってはいけません。

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

script と link 向けに nonce を `app.html` に手動で含めるには、`%sveltekit.nonce%` プレースホルダーをお使いいただけます (例えば `<script nonce="%sveltekit.nonce%">`)。

ページがプリレンダリングされる場合、CSP ヘッダーは `<meta http-equiv>` タグ経由で追加されます (この場合、`frame-ancestors`、`report-uri`、`sandbox` ディレクティブは無視されることにご注意ください)。

> `mode` が `'auto'` の場合、SvelteKit は動的にレンダリングされたページには nonce を、プリレンダリングされたページには hash を使用します。プリレンダリングされたページで nonce を使用するのは安全でないため、禁止されています。

> ほとんどの [Svelte transitions](https://svelte.jp/tutorial/transition) は、インラインの `<style>` 要素を作成することで動作することにご注意ください。これらをアプリで使用する場合、`style-src` ディレクティブを指定しないようにするか、`unsafe-inline` を追加する必要があります。

### csrf

[クロスサイト・リクエスト・フォージェリ(cross-site request forgery)](https://owasp.org/www-community/attacks/csrf) 攻撃に対する防御です:

- `checkOrigin` — `true` の場合、SvelteKit は `POST` による form 送信を受け取ったとき、受け取った `origin` ヘッダーをチェックし、それがサーバーの origin と一致するか検証します

別の origin からあなたのアプリに対して `POST` による form 送信をできるようにするには、このオプションを無効にする必要があります。ご注意ください!

### env

環境変数の設定です:

- `dir` — `.env` ファイルを検索するディレクトリです。
- `publicPrefix` — クライアントサイドのコードに公開しても安全であることを示す接頭辞です。[`$env/static/public`](/docs/modules#$env-static-public) と [`$env/dynamic/public`](/docs/modules#$env-dynamic-public) をご参照ください。Vite の環境変数のハンドリングを使用する場合は、Vite の [`envPrefix`](https://ja.vitejs.dev/config/shared-options.html#envprefix) を別途設定する必要があることにご注意ください。もっとも、通常はこの機能を使用する必要はありません。

### files

以下の `string` 値のうち、0 個以上を含むオブジェクトです:

- `assets` — `favicon.ico` or `manifest.json` のような、何も処理する必要もなく、安定した URL を持つべき静的ファイルを配置する場所
- `hooks` — クライントとサーバーの hooks のロケーション([Hooks](/docs/hooks) をご参照ください)
- `lib` — コードベース全体から `$lib` でアクセスできる、アプリの内部ライブラリ
- `params` — [parameter matchers](/docs/advanced-routing#matching) を含むディレクトリ
- `routes` — アプリの構造を定義するファイル([ルーティング](/docs/routing) をご参照ください)
- `serviceWorker` — Service Worker のエントリーポイントのロケーション([Service workers](/docs/service-workers) をご参照ください)
- `template` — HTML レスポンス用テンプレートのロケーション

### inlineStyleThreshold

CSS を HTML の先頭の `<style>` ブロック内にインライン化するかどうか。このオプションでは、インライン化する CSS ファイルの最大長を数値で指定します。ページに必要な CSS ファイルで、このオプションの値より小さいものはマージされ、`<style>` ブロックにインライン化されます。

> この結果、最初のリクエストが少なくなり、[First Contentful Paint](https://web.dev/first-contentful-paint) スコアを改善することができます。しかし、HTML 出力が大きくなり、ブラウザキャッシュの効果が低下します。慎重に使用してください。

### moduleExtensions

SvelteKit がモジュールとして取り扱うファイル拡張子の配列です。`config.extensions` と `config.kit.moduleExtensions` のいずれにもマッチしない拡張子のファイルはルーター (router) から無視されます。

### outDir

SvelteKit が `dev` と `build` のときにファイルを書き込むディレクトリです。このディレクトリをバージョン管理から除外する必要があります。

### package

[パッケージ作成](/docs/packaging) に関連するオプションです。

- `source` - library directory
- `dir` - 出力ディレクトリ
- `emitTypes` - デフォルトでは、`svelte-package` は自動的にパッケージの型を `.d.ts` ファイル形式で生成します。型の生成は設定で変更できますが、常に型を生成することがエコシステムの品質にとってベストであると私たちは信じています。`false` に設定するときは、十分な理由があることを確認してください(例えば、代わりに手書きの型定義を提供したい場合など)
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
	package: {
		exports: (filepath) => {
			if (filepath.endsWith('.d.ts')) return false;
			return mm.isMatch(filepath, ['!**/_*', '!**/internal/**']);
		},
		files: mm.matcher('!**/build.*')
	}
};

export default config;
```

### paths

以下の `string` 値のうち、0 個以上を含むオブジェクトです:

- `assets` — アプリのファイルが提供される絶対パス。これは、何らかのストレージバケットからファイルを提供する場合に便利です
- `base` — ルート相対パス。空文字以外を指定する場合、先頭は `/` で始めなければならず、末尾は `/` で終わってはいけません (例 `/base-path`)。アプリがどこから提供されるかを指定することで、アプリを非ルートパスで動作させることができます。ルート相対(root-relative)なリンクには先頭に base の値を追加しなければなりません。そうしないと、リンクが `base` ではなくドメインのルート(root)を指してしまいます (これはブラウザの動作によるものです)。これに対しては、[`base` from `$app/paths`](/docs/modules#$app-paths-base) をこのように使用することができます: `<a href="{base}/your-page">Link</a>`。もし、これを頻繁に書くようであれば、再利用可能なコンポーネントに抽出するのも良いでしょう。

### prerender

[プリレンダリング(Prerendering)](/docs/page-options#prerender) をご参照ください。以下のうち、0 個以上を含むオブジェクトです:

- `concurrency` — 同時にいくつのページをプリレンダリングできるか。JS はシングルスレッドですが、プリレンダリングのパフォーマンスがネットワークに縛られている場合(例えば、リモートの CMS からコンテンツをロードしている場合)、ネットワークの応答を待っている間に他のタスクを処理することで高速化することができます
- `crawl` — SvelteKit がシードページからリンクをたどってプリレンダリングするページを見つけるかどうかを決定します
- `enabled` — `false` に設定すると、プリレンダリングを完全に無効化できます
- `entries` — プリレンダリングするページ、またはクロールを開始するページ(`crawl: true` の場合)の配列。`*` 文字列には、全ての動的ではないルート(routes)(例えば `[parameters]` を持たないページです。なぜなら SvelteKit はその parameters がどんな値を持つべきかわからないからです) が含まれます
- `handleHttpError`

  - `'fail'` — (デフォルト) リンクをたどったときにルーティングエラーが発生した場合、ビルドを失敗させます
  - `'ignore'` - 失敗を無視して継続させます
  - `'warn'` — 継続しますが、警告(warning)を出力します
  - `(details) => void` — `status`、`path`、`referrer`、`referenceType`、`message` プロパティを持つ `details` オブジェクトを引数に取るカスタムのエラーハンドラです。この関数から `throw` されると、ビルドが失敗します

      ```js
    /** @type {import('@sveltejs/kit').Config} */
    const config = {
    	kit: {
    		prerender: {
    			handleHttpError: ({ path, referrer, message }) => {
    				// ignore deliberate link to shiny 404 page
    				if (path === '/not-found' && referrer === '/blog/how-we-built-our-404-page') {
    					return;
    				}

    				// otherwise fail the build
    				throw new Error(message);
    			}
    		}
    	}
    };
    ```

- `handleMissingId`

  - `'fail'` — (default) プリレンダリングページから他のプリレンダリングページへの、`#` フラグメントを使用しているリンクが、`id` に一致しない場合、ビルドを失敗させます
  - `'ignore'` - 失敗を無視して継続させます
  - `'warn'` — 継続しますが、警告(warning)を出力します
  - `(details) => void` — `path`、`id`、`referrers`、`message` プロパティを持つ `details` オブジェクトを引数に取るカスタムのエラーハンドラです。この関数から `throw` されると、ビルドが失敗します

- `origin` — プリレンダリング時の `url.origin` の値です。レンダリングされたコンテンツに含まれている場合に有用です。

### serviceWorker

以下の値のうち、0 個以上を含むオブジェクトです:

- `register` - `false` を設定した場合、service worker の自動登録を無効にします。
- `files` - `(filepath: string) => boolean` という型を持つ関数。`true` の場合、与えられたファイルが `$service-worker.files` で利用可能になります。それ以外の場合は除外されます。

### version

以下の値のうち、0 個以上を含むオブジェクトです:

- `name` - 現在のアプリのバージョン文字列
- `pollInterval` - バージョンの変更をポーリングするインターバル(ミリ秒)

アプリが使用されているときにアプリの新しいバージョンをデプロイするとクライアントサイドのナビゲーションにバグが発生することがあります。次に開くページのコードがすでにロードされている場合、古いコンテンツがある可能性があります。そうでなくとも、アプリのルートマニフェストがもう存在しない JavaScript ファイルを指している可能性があります。SvelteKit は、ここで指定された `name` (デフォルトではビルドのタイムスタンプ) を使用して新しいバージョンがデプロイされたことを検知すると、従来のフルページナビゲーションにフォールバックすることにより、この問題を解決しています。

`pollInterval` を 0 以外の値に設定した場合、SvelteKit はバックグラウンドで新しいバージョンをポーリングし、それを検知すると [`updated`](/docs/modules#$app-stores-updated) ストアの値を `true` にします。
