/// <reference types="svelte" />
/// <reference types="vite/client" />

import './ambient.js';

import { CompileOptions } from 'svelte/types/compiler/interfaces';
import {
	AdapterEntry,
	CspDirectives,
	Logger,
	MaybePromise,
	Prerendered,
	PrerenderHttpErrorHandlerValue,
	PrerenderMissingIdHandlerValue,
	RequestOptions,
	RouteDefinition,
	UniqueInterface
} from './private.js';
import { SSRNodeLoader, SSRRoute, ValidatedConfig } from './internal.js';

export { PrerenderOption } from './private.js';

/**
 * [Adapters](https://kit.svelte.jp/docs/adapters) は、本番向けビルドを、あなたが選んだプラットフォームにデプロイできる形式に変換する役割を担います。
 */
export interface Adapter {
	/**
	 * adapter の名前です。ログに使用されます。通常はパッケージー名と同じものになります。
	 */
	name: string;
	/**
	 * SvelteKit がアプリをビルドしたあとにこの関数が呼ばれます。
	 * @param builder SvelteKit が提供するオブジェクトで、アプリを対象の環境に合わせる(adapt)ためのメソッドが含まれています
	 */
	adapt(builder: Builder): MaybePromise<void>;
}

type AwaitedPropertiesUnion<input extends Record<string, any> | void> = input extends void
	? undefined // needs to be undefined, because void will break intellisense
	: input extends Record<string, any>
	? {
			[key in keyof input]: Awaited<input[key]>;
	  }
	: {} extends input // handles the any case
	? input
	: unknown;

export type AwaitedProperties<input extends Record<string, any> | void> =
	AwaitedPropertiesUnion<input> extends Record<string, any>
		? OptionalUnion<AwaitedPropertiesUnion<input>>
		: AwaitedPropertiesUnion<input>;

export type AwaitedActions<T extends Record<string, (...args: any) => any>> = {
	[Key in keyof T]: OptionalUnion<UnpackValidationError<Awaited<ReturnType<T[Key]>>>>;
}[keyof T];

// Takes a union type and returns a union type where each type also has all properties
// of all possible types (typed as undefined), making accessing them more ergonomic
type OptionalUnion<
	U extends Record<string, any>, // not unknown, else interfaces don't satisfy this constraint
	A extends keyof U = U extends U ? keyof U : never
> = U extends unknown ? { [P in Exclude<A, keyof U>]?: never } & U : never;

type UnpackValidationError<T> = T extends ActionFailure<infer X>
	? X
	: T extends void
	? undefined // needs to be undefined, because void will corrupt union type
	: T;

/**
 * このオブジェクトは adapter の `adapt` 関数に渡されます。
 * アプリを対象の環境に合わせる(adapt)のに役立つ様々なメソッドとプロパティが含まれています。
 */
export interface Builder {
	/** メッセージをコンソールにプリントします。Vite の `logLevel` が `info` でない限り、`log.info` と `log.minor` はサイレントです。 */
	log: Logger;
	/** `dir` とそのコンテンツを全て削除します。 */
	rimraf(dir: string): void;
	/** `dir` とそれに必要な親ディレクトリを作成します。 */
	mkdirp(dir: string): void;

	/** 完全に解決(resolve)された `svelte.config.js` です。 */
	config: ValidatedConfig;
	/** プリレンダリングされたページとアセット情報です (もしあれば)。 */
	prerendered: Prerendered;

	/**
	 * アプリの1つ以上のルート(routes)にマップする別の関数を作成します。
	 * @param fn 一連のルート(routes)をエントリーポイントにまとめる関数
	 */
	createEntries(fn: (route: RouteDefinition) => AdapterEntry): Promise<void>;

	/**
	 * 静的な web サーバーが、マッチするルート(route)がない場合に使用するフォールバックページ(fallback page)を生成します。シングルページアプリにとって有用です。
	 */
	generateFallback(dest: string): Promise<void>;

	/**
	 * SvelteKit [サーバー](https://kit.svelte.jp/docs/types#public-types-server)を初期化するためのサーバーサイド manifest を生成します。
	 * @param opts アプリのベースディレクトリに対する相対パスと、オプションで、生成される manifest の形式 (esm または cjs) を指定
	 */
	generateManifest(opts: { relativePath: string }): string;

	/**
	 * `outDir` 内の `name` ディレクトリへのパス (例: `/path/to/.svelte-kit/my-adapter`) を解決します。
	 * @param name ファイルへのパスで、ビルドディレクトリに対して相対
	 */
	getBuildDirectory(name: string): string;
	/** クライアントサイドのアセット (`static` ディレクトリのコンテンツを含む) があるディレクトリへの完全に解決されたパスを取得します。 */
	getClientDirectory(): string;
	/** サーバーサイドコードがあるディレクトリへの完全に解決されたパスを取得します。 */
	getServerDirectory(): string;
	/** 設定された `base` パスを含むアプリケーションパス (例: `/my-base-path/_app`) を取得します。 */
	getAppPath(): string;

	/**
	 * クライアントのアセットを `dest` に書き込みます。
	 * @param dest 書き込み先のフォルダ
	 * @returns `dest` に書き込まれたファイルの配列
	 */
	writeClient(dest: string): string[];
	/**
	 * プリレンダリングされたファイルを `dest` に書き込みます。
	 * @param dest 書き込み先のフォルダ
	 * @returns `dest` に書き込まれたファイルの配列
	 */
	writePrerendered(dest: string): string[];
	/**
	 * サーバーサイドのコードを `dest` に書き込みます。
	 * @param dest 書き込み先のフォルダ
	 * @returns `dest` に書き込まれたファイルの配列
	 */
	writeServer(dest: string): string[];
	/**
	 * ファイルやディレクトリをコピーします。
	 * @param from コピー元のファイルやディレクトリ
	 * @param to コピー先のファイルやディレクトリ
	 * @param opts.filter ファイルやディレクトリをコピーするかどうか判定するための関数
	 * @param opts.replace 置換する文字列のマップ
	 * @returns コピーされたファイルの配列
	 */
	copy(
		from: string,
		to: string,
		opts?: {
			filter?(basename: string): boolean;
			replace?: Record<string, string>;
		}
	): string[];

	/**
	 * 必要に応じて、`directory` にあるファイルを gzip や brotli で圧縮します。`.gz` ファイルや `.br` ファイルはオリジナルと同じ場所に生成されます。
	 * @param {string} directory 圧縮したいファイルを含むディレクトリ
	 */
	compress(directory: string): Promise<void>;
}

export interface Config {
	/**
	 * Options passed to [`svelte.compile`](https://svelte.jp/docs#compile-time-svelte-compile).
	 * @default {}
	 */
	compilerOptions?: CompileOptions;
	/**
	 * List of file extensions that should be treated as Svelte files.
	 * @default [".svelte"]
	 */
	extensions?: string[];
	/** SvelteKit options */
	kit?: KitConfig;
	/** [`@sveltejs/package`](/docs/packaging) options. */
	package?: {
		source?: string;
		dir?: string;
		emitTypes?: boolean;
		exports?(filepath: string): boolean;
		files?(filepath: string): boolean;
	};
	/** Preprocessor options, if any. Preprocessing can alternatively also be done through Vite's preprocessor capabilities. */
	preprocess?: any;
	/** Any additional options required by tooling that integrates with Svelte. */
	[key: string]: any;
}

export interface Cookies {
	/**
	 * 事前に `cookies.set` で設定された cookie や、またはリクエストヘッダーから cookie を取得します。
	 * @param name cookie の名前
	 * @param opts 直接 `cookie.parse` に渡されるオプション。ドキュメントは[こちら](https://github.com/jshttp/cookie#cookieparsestr-options)
	 */
	get(name: string, opts?: import('cookie').CookieParseOptions): string | undefined;

	/**
	 * cookie を設定します。これはレスポンスに `set-cookie` ヘッダーを追加し、また、現在のリクエスト中に `cookies.get` を通じてその cookie を利用可能にします。
	 *
	 * `httpOnly` と `secure` オプションはデフォルトで `true` となっており (http://localhost の場合は例外として `secure` は `false` です)、クライアントサイドの JavaScript で cookie を読み取ったり、HTTP 上で送信したりしたい場合は、明示的に無効にする必要があります。`sameSite` オプションのデフォルトは `lax` です。
	 *
	 * デフォルトでは、cookie の `path` は 現在のパス名の 'ディレクトリ' です。ほとんどの場合、cookie をアプリ全体で利用可能にするには明示的に `path: '/'` を設定する必要があります。
	 * @param name cookie の名前
	 * @param value cookie の値
	 * @param opts 直接 `cookie.serialize` に渡されるオプション。ドキュメントは[こちら](https://github.com/jshttp/cookie#cookieserializename-value-options)
	 */
	set(name: string, value: string, opts?: import('cookie').CookieSerializeOptions): void;

	/**
	 * 値に空文字列(empty string)を設定したり、有効期限(expiry date)を過去に設定することで、cookie を削除します。
	 *
	 * デフォルトでは、cookie の `path` は現在のパス名の 'ディレクトリ' です。ほとんどの場合、cookie をアプリ全体で利用可能にするには明示的に `path: '/'` を設定する必要があります。
	 * @param name cookie の名前
	 * @param opts 直接 `cookie.serialize` に渡されるオプション。`path` はあなたが削除したい cookie の path と一致する必要があります。ドキュメントは[こちら](https://github.com/jshttp/cookie#cookieserializename-value-options)
	 */
	delete(name: string, opts?: import('cookie').CookieSerializeOptions): void;

	/**
	 * cookie の名前と値のペアを Set-Cookie ヘッダー文字列にシリアライズします。ただし、それをレスポンスに適用しないでください。
	 *
	 * `httpOnly` と `secure` オプションはデフォルトで `true` となっており (http://localhost の場合は例外として `secure` は `false` です)、クライアントサイドの JavaScript で cookie を読み取ったり、HTTP 上で送信したりしたい場合は、明示的に無効にする必要があります。`sameSite` オプションのデフォルトは `lax` です。
	 *
	 * デフォルトでは、cookie の `path` は 現在のパス名です。ほとんどの場合、cookie をアプリ全体で利用可能にするには明示的に `path: '/'` を設定する必要があります。
	 *
	 * @param name cookie の名前
	 * @param value cookie の値
	 * @param opts 直接 `cookie.serialize` に渡されるオプション。ドキュメントは[こちら](https://github.com/jshttp/cookie#cookieserializename-value-options)
	 */
	serialize(name: string, value: string, opts?: import('cookie').CookieSerializeOptions): string;
}

export interface KitConfig {
	/**
	 * [adapter](https://kit.svelte.jp/docs/adapters) は、`vite build` の実行中に実行されます。これによってどのプラットフォーム向けにアウトプットを変換するか決定します。
	 * @default undefined
	 */
	adapter?: Adapter;
	/**
	 * `import` 文の値を置き換えるのに使用されるエイリアスを0個以上含むオブジェクトです。これらのエイリアスは自動的に Vite と TypeScript に渡されます。
	 *
	 * ```js
	 * /// file: svelte.config.js
	 * /// type: import('@sveltejs/kit').Config
	 * const config = {
	 *   kit: {
	 *     alias: {
	 *       // this will match a file
	 *       'my-file': 'path/to/my-file.js',
	 *
	 *       // this will match a directory and its contents
	 *       // (`my-directory/x` resolves to `path/to/my-directory/x`)
	 *       'my-directory': 'path/to/my-directory',
	 *
	 *       // an alias ending /* will only match
	 *       // the contents of a directory, not the directory itself
	 *       'my-directory/*': 'path/to/my-directory/*'
	 *     }
	 *   }
	 * };
	 * ```
	 *
	 * > ビルトインの `$lib` エイリアスはパッケージングに使用されるため、`config.kit.files.lib` でコントロールされます。
	 *
	 * > `jsconfig.json` や `tsconfig.json` に必要なエイリアス設定を、SvelteKit に自動的に生成させるためには、`npm run dev` を実行する必要があります。
	 * @default {}
	 */
	alias?: Record<string, string>;
	/**
	 * ビルドされた JS と CSS (とインポートされたアセット) が提供されるディレクトリで、`paths.assets` との相対です。(ファイル名にはそれ自体にコンテンツベースのハッシュが含まれるため、無期限にキャッシュすることができます)。先頭と末尾を `/` にすることはできません。
	 * @default "_app"
	 */
	appDir?: string;
	/**
	 * [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) の設定です。CSP は、読み込むことができるリソースを、そのリソースの場所(ドメインなど)で制限することによって、クロスサイトスクリプティング(XSS)攻撃からユーザーを守るのに役立ちます。例えば、このような設定の場合…
	 *
	 * ```js
	 * /// file: svelte.config.js
	 * /// type: import('@sveltejs/kit').Config
	 * const config = {
	 *   kit: {
	 *     csp: {
	 *       directives: {
	 *         'script-src': ['self']
	 *       },
	 *       reportOnly: {
	 *         'script-src': ['self']
	 *       }
	 *     }
	 *   }
	 * };
	 *
	 * export default config;
	 * ```
	 *
	 * …外部サイトのスクリプトの読み込みを防ぐことができます。SvelteKit は、生成されるインラインスタイルとスクリプトに対し、指定したディレクティブを nonce または hash (`mode` の設定による) で補強します。
	 *
	 * `src/app.html` の script や link に nonce を追加するには、`%sveltekit.nonce%` プレースホルダーをお使いください (例えば `<script nonce="%sveltekit.nonce%">`)。
	 *
	 * ページがプリレンダリングされる場合、CSP ヘッダーは `<meta http-equiv>` タグで追加されます (この場合、`frame-ancestors`、`report-uri`、`sandbox` ディレクティブは無視されることにご注意ください)。
	 *
	 * > `mode` が `'auto'` の場合、SvelteKit は動的にレンダリングされるページには nonce を使用し、プリレンダリングされたページには hash を使用します。プリレンダリングされたページに nonce を使用するのは安全ではないため、禁止されています。
	 *
	 * > 多くの [Svelte transitions](https://svelte.jp/tutorial/transition) はインラインの `<style>` 要素を作成することで動作することにご注意ください。アプリでこれらを使用する場合は、`style-src` ディレクティブを指定しないようにするか、`unsafe-inline` を追加する必要があります。
	 */
	csp?: {
		/**
		 * `<script>` と `<style>` 要素の制限に hash と nonce のどちらを使用するか。`'auto'` の場合、プリレンダリングされたページには hash を、動的にレンダリングされるページには nonce が使用されます。
		 */
		mode?: 'hash' | 'nonce' | 'auto';
		/**
		 * `Content-Security-Policy` ヘッダーに追加されるディレクティブです。
		 */
		directives?: CspDirectives;
		/**
		 * `Content-Security-Policy-Report-Only` ヘッダーに追加されるディレクティブです。
		 */
		reportOnly?: CspDirectives;
	};
	/**
	 * [cross-site request forgery](https://owasp.org/www-community/attacks/csrf) 攻撃からの防御の設定です。
	 */
	csrf?: {
		/**
		 * `POST` フォーム送信時、受信した `origin` ヘッダーをチェックしてサーバーのオリジン(origin)と一致するか検証することを行うかどうか。
		 *
		 * 別のオリジンにあるあなたのアプリに対して `POST` フォーム送信をできるようにするには、このオプションを無効にする必要があります。ご注意を!
		 * @default true
		 */
		checkOrigin?: boolean;
	};
	/**
	 * アプリが別の大規模なアプリに埋め込まれているかどうか。もし `true` の場合、SvelteKit はナビゲーションなどに関係するイベントリスナーを、`window` の代わりに `%sveltekit.body%` の親に追加し、`params` を `location.pathname` から導くのではなく、サーバーから取得して渡します。
	 * @default false
	 */
	embedded?: boolean;
	/**
	 * 環境変数設定
	 */
	env?: {
		/**
		 * `.env` ファイルを探すディレクトリです。
		 * @default "."
		 */
		dir?: string;
		/**
		 * クライアントサイドコードに公開されても安全な環境変数に付与される接頭辞です。[`$env/static/public`](/docs/modules#$env-static-public) と [`$env/dynamic/public`](/docs/modules#$env-dynamic-public) をご覧ください。Vite の環境変数ハンドリングを使用する場合は、別途 Vite の [`envPrefix`](https://vitejs.dev/config/shared-options.html#envprefix) を設定する必要があることにご注意ください - ただし、通常この機能を使う必要はありません。
		 * @default "PUBLIC_"
		 */
		publicPrefix?: string;
	};
	/**
	 * プロジェクト内の各種ファイルの場所。
	 */
	files?: {
		/**
		 * `favicon.ico` や `manifest.json` のように、不変の URL を持つ、何も処理されない静的なファイルを置く場所です
		 * @default "static"
		 */
		assets?: string;
		hooks?: {
			/**
			 * クライアントの [hooks](https://kit.svelte.jp/docs/hooks) のロケーションです。
			 * @default "src/hooks.client"
			 */
			client?: string;
			/**
			 * サーバーの [hooks](https://kit.svelte.jp/docs/hooks) のロケーションです。
			 * @default "src/hooks.server"
			 */
			server?: string;
		};
		/**
		 * コードベース全体から `$lib` としてアクセスできる、アプリの内部ライブラリ
		 * @default "src/lib"
		 */
		lib?: string;
		/**
		 * [parameter matchers](https://kit.svelte.jp/docs/advanced-routing#matching) を置くディレクトリ
		 * @default "src/params"
		 */
		params?: string;
		/**
		 * アプリの構造を定義するファイル ([Routing](https://kit.svelte.jp/docs/routing) をご覧ください)
		 * @default "src/routes"
		 */
		routes?: string;
		/**
		 * service worker のエントリーポイントのロケーション ([Service workers](https://kit.svelte.jp/docs/service-workers) をご覧ください)
		 * @default "src/service-worker"
		 */
		serviceWorker?: string;
		/**
		 * HTML レスポンスのテンプレートのロケーション
		 * @default "src/app.html"
		 */
		appTemplate?: string;
		/**
		 * フォールバックエラーレスポンスのテンプレートのロケーション
		 * @default "src/error.html"
		 */
		errorTemplate?: string;
	};
	/**
	 * HTML の head の `<style>` ブロックの中のインライン CSS です。このオプションには、インライン化される CSS ファイルの最大長を数値で指定します。ページに必要な CSS ファイルで、この数値より小さいものは全てマージされ、`<style>` ブロックにインライン化されます。
	 *
	 * > これによって初期リクエストが減り、[First Contentful Paint](https://web.dev/first-contentful-paint) スコアを改善することができます。しかし、より大きな HTML が生成され、ブラウザのキャッシュの有効性を低下させます。慎重にお使いください。
	 * @default 0
	 */
	inlineStyleThreshold?: number;
	/**
	 * SvelteKit がモジュールとして扱うファイルの拡張子の配列です。`config.extensions` と `config.kit.moduleExtensions` のいずれにもマッチしない拡張子のファイルは、ルーターから無視されます。
	 * @default [".js", ".ts"]
	 */
	moduleExtensions?: string[];
	/**
	 * SvelteKit が `dev` や `build` 中にファイルを書き込むディレクトリです。このディレクトリはバージョンコントロールから除外すると良いでしょう。
	 * @default ".svelte-kit"
	 */
	outDir?: string;
	paths?: {
		/**
		 * アプリのファイルが提供される絶対パス(absolute path)です。これは、何らかのストレージバケットからファイルを提供する場合に有用です。
		 * @default ""
		 */
		assets?: string;
		/**
		 * ルート相対なパス(root-relative path)です。空文字(empty string)以外を指定する場合、先頭は `/` を付ける必要があり、末尾には `/` を付けてはいけません (例: `/base-path`)。アプリがどこから提供されるかを指定することで、アプリをルートではないパス(non-root path)で動作させることができます。ルート相対(root-relative)なリンクには、先頭に base の値を追加しなければなりません。そうしないとリンクが `base` ではなくドメインのルート(root)を指してしまいます(これはブラウザの動作によるものです)。これを行うには、[`base` from `$app/paths`](/docs/modules#$app-paths-base) をインポートして `<a href="{base}/your-page">Link</a>` のようにします。もし、これを頻繁に書くようであれば、再利用可能なコンポーネントに抽出するのも良いでしょう。
		 * @default ""
		 */
		base?: string;
	};
	/**
	 * [プリレンダリング](https://kit.svelte.jp/docs/page-options#prerender) をご覧ください。
	 */
	prerender?: {
		/**
		 * 同時にいくつのページをプリレンダリングできるか。JS はシングルスレッドですが、プリレンダリングのパフォーマンスがネットワークに縛られている場合(例えば、リモートの CMS からコンテンツをロードしている場合)、ネットワークの応答を待っている間に他のタスクを処理することで高速化することができます。
		 * @default 1
		 */
		concurrency?: number;
		/**
		 * SvelteKit が `entries` からリンクをたどってプリレダリングするページを探すかどうか。
		 * @default true
		 */
		crawl?: boolean;
		/**
		 * プリレンダリングするページ、または (`crawl: true` の場合は) クローリングを開始するページの配列。`*` 文字列は、全ての動的でないルート(route) (つまり、`[parameters]` がないページです。なぜなら、SvelteKit は その parameters がどんな値を持つかわからないからです) が含まれます。
		 * @default ["*"]
		 */
		entries?: Array<'*' | `/${string}`>;
		/**
		 * アプリのプリレンダリング中に発生した HTTP エラーに対する応答方法。
		 *
		 * - `'fail'` — ビルドを失敗させます
		 * - `'ignore'` - 失敗(failure)を無視して継続させます
		 * - `'warn'` — 継続しますが、警告(warning)をプリントします
		 * - `(details) => void` — `status`、`path`、`referrer`、`referenceType`、`message` プロパティを持つ `details` オブジェクトを引数に取るカスタムのエラーハンドラです。この関数から `throw` されると、ビルドが失敗します
		 *
		 * ```js
		 * /// type: import('@sveltejs/kit').Config
		 * const config = {
		 *   kit: {
		 *     prerender: {
		 *       handleHttpError: ({ path, referrer, message }) => {
		 *         // ignore deliberate link to shiny 404 page
		 *         if (path === '/not-found' && referrer === '/blog/how-we-built-our-404-page') {
		 *           return;
		 *         }
		 *
		 *         // otherwise fail the build
		 *         throw new Error(message);
		 *       }
		 *     }
		 *   }
		 * };
		 * ```
		 *
		 * @default "fail"
		 */
		handleHttpError?: PrerenderHttpErrorHandlerValue;
		/**
		 * あるプリレンダリングページから別のプリレンダリングページへのハッシュリンクが、リンク先ページの `id` に対応していない場合の応答方法
		 *
		 * - `'fail'` — ビルドを失敗させます
		 * - `'ignore'` - 失敗(failure)を無視して継続させます
		 * - `'warn'` — 継続しますが、警告(warning)をプリントします
		 * - `(details) => void` — `path`、`id`、`referrers`、`message` プロパティを持つ `details` オブジェクトを引数に取るカスタムのエラーハンドラです。この関数から `throw` されると、ビルドが失敗します
		 *
		 * @default "fail"
		 */
		handleMissingId?: PrerenderMissingIdHandlerValue;
		/**
		 * `origin` — プリレンダリング時の `url.origin` の値です。レンダリングされたコンテンツに含まれていると有用な場合があります。
		 * @default "http://sveltekit-prerender"
		 */
		origin?: string;
	};
	serviceWorker?: {
		/**
		 * service worker が存在する場合、自動的に登録するかどうか。
		 * @default true
		 */
		register?: boolean;
		/**
		 * `static` ディレクトリにあるどのファイルを `$service-worker.files` で利用可能にするかを決定します。
		 * @default (filename) => !/\.DS_Store/.test(filename)
		 */
		files?(filepath: string): boolean;
	};
	typescript?: {
		/**
		 * A function that allows you to edit the generated `tsconfig.json`. You can mutate the config (recommended) or return a new one.
		 * This is useful for — to example — extend a shared `tsconfig.json` in a monorepo root
		 * @default (config) => config
		 */
		config?: (config: Record<string, any>) => Record<string, any> | void;
	};
	/**
	 * アプリが使用されているときにアプリの新しいバージョンをデプロイするとクライアントサイドのナビゲーションにバグが発生することがあります。次に開くページのコードがすでにロードされている場合、そこに古いコンテンツがある可能性があります。そうでなくとも、アプリのルートマニフェスト(route manifest)が、もう存在しない JavaScript ファイルを指している可能性があります。SvelteKit は、ここで指定された `name` (デフォルトではビルドのタイムスタンプ) を使用して新しいバージョンがデプロイされたことを検知し、従来のフルページナビゲーションにフォールバックすることにより、この問題を解決しています。
	 *
	 * `pollInterval` を 0 以外の値に設定した場合、SvelteKit はバックグラウンドで新しいバージョンをポーリングし、それを検知すると [`updated`](/docs/modules#$app-stores-updated) ストアの値を `true` にします。
	 */
	version?: {
		/**
		 * アプリの現在のバージョンの文字列です。
		 * @default Date.now().toString()
		 */
		name?: string;
		/**
		 * バージョンの変更をポーリングするインターバル(ミリ秒)です。これが `0` の場合、ポーリングは発生しません。
		 * @default 0
		 */
		pollInterval?: number;
	};
}

/**
 * [`handle`](https://kit.svelte.jp/docs/hooks#server-hooks-handle) hook は SvelteKit サーバーが[リクエスト](https://kit.svelte.jp/docs/web-standards#fetch-apis-request)を受け取るたびに実行され、
 * [レスポンス](https://kit.svelte.jp/docs/web-standards#fetch-apis-response)を決定します。
 * リクエストを表す `event` オブジェクトと、`resolve` と呼ばれる、ルート(route)をレンダリングして `Response` を生成する関数を受け取ります。
 * これによってレスポンスヘッダーとボディを変更したり、SvelteKit を完全にバイパスすることができます (例えば、プログラムによるルート(routes)実装など)。
 */
export interface Handle {
	(input: {
		event: RequestEvent;
		resolve(event: RequestEvent, opts?: ResolveOptions): MaybePromise<Response>;
	}): MaybePromise<Response>;
}

/**
 * サーバーサイドの [`handleError`](https://kit.svelte.jp/docs/hooks#shared-hooks-handleerror) hook は、リクエストの応答中に予期せぬエラー(unexpected error)がスローされたときに実行されます。
 *
 * もし予期せぬエラーが load か レンダリング中にスローされた場合、この関数はその error と event を引数に取って呼び出されます。
 * この関数では決してエラーをスローしないようにしてください。
 */
export interface HandleServerError {
	(input: { error: unknown; event: RequestEvent }): MaybePromise<void | App.Error>;
}

/**
 * クライアントサイドの [`handleError`](https://kit.svelte.jp/docs/hooks#shared-hooks-handleerror) hook は、ナビゲーション中に予期せぬエラー(unexpected error)がスローされたときに実行されます。
 *
 * もし予期せぬエラーが load かその後のレンダリング中にスローされた場合、この関数はその error と error と event を引数に取って呼び出されます。
 * この関数では決してエラーをスローしないようにしてください。
 */
export interface HandleClientError {
	(input: { error: unknown; event: NavigationEvent }): MaybePromise<void | App.Error>;
}

/**
 * [`handleFetch`](https://kit.svelte.jp/docs/hooks#server-hooks-handlefetch) hook によって、サーバーで(またはプリレンダリング中に)実行される `load` 関数の内側で実行される `fetch` リクエストを変更 (または置換) することができます
 */
export interface HandleFetch {
	(input: { event: RequestEvent; request: Request; fetch: typeof fetch }): MaybePromise<Response>;
}

/**
 * `PageLoad` と `LayoutLoad` のジェネリックなフォームです。`Load` を直接使用するのではなく、`./$types` ([generated types](https://kit.svelte.jp/docs/types#generated-types) 参照) から
 * インポートしてください。
 */
export interface Load<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	InputData extends Record<string, unknown> | null = Record<string, any> | null,
	ParentData extends Record<string, unknown> = Record<string, any>,
	OutputData extends Record<string, unknown> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> {
	(event: LoadEvent<Params, InputData, ParentData, RouteId>): MaybePromise<OutputData>;
}

/**
 * `PageLoadEvent` と `LayoutLoadEvent` のジェネリック型。`LoadEvent` を直接使用するのではなく、
 * `./$types` ([generated types](https://kit.svelte.jp/docs/types#generated-types) 参照) をインポートしたほうが良いでしょう。
 */
export interface LoadEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	Data extends Record<string, unknown> | null = Record<string, any> | null,
	ParentData extends Record<string, unknown> = Record<string, any>,
	RouteId extends string | null = string | null
> extends NavigationEvent<Params, RouteId> {
	/**
	 * `fetch` は[ネイティブの `fetch` web API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) と同等ですが、いくつか機能が追加されています:
	 *
	 * - ページリクエストの `cookie` と `authorization` ヘッダーを継承するため、サーバー上で認証情報付きのリクエストを行うのに使用することができます。
	 * - サーバー上で相対パスのリクエストを行うことができます (通常、`fetch` は、サーバーのコンテキストで使用する場合 origin 付きの URL が必要です)
	 * - サーバー上で実行されている場合、内部リクエスト (例えば `+server.js` ルート(routes)に対するリクエスト) は、直接ハンドラ関数を呼び出すので、HTTP を呼び出すオーバーヘッドがありません。
	 * - サーバーサイドレンダリングでは、レスポンスはキャプチャされ、レンダリングされた HTML にインライン化されます。ヘッダーは、[`filterSerializedResponseHeaders`](https://kit.svelte.jp/docs/hooks#server-hooks-handle) を介して明示的に含めない限り、シリアライズされないことにご注意ください。
	 * - ハイドレーションでは、レスポンスは HTML から読み取られるため、一貫性が保証され、追加のネットワークリクエストを防ぎます
	 *
	 * > Cookie は、ターゲットホストが Sveltekit アプリケーションと同じか、より明確・詳細(specific)なサブドメインである場合にのみ引き渡されます。
	 */
	fetch: typeof fetch;
	/**
	 * ルート(route) の、`+layout.server.js` や `+page.server.js` にあるサーバー `load` 関数から返されたデータがあれば、それが含まれます。
	 */
	data: Data;
	/**
	 * レスポンスにヘッダーを設定する必要がある場合、このメソッドを使ってそれを実現することができます。これはページをキャッシュさせる場合に便利です。例えば:
	 *
	 *	```js
	 *	/// file: src/routes/blog/+page.js
	 *	export async function load({ fetch, setHeaders }) {
	 *		const url = `https://cms.example.com/articles.json`;
	 *		const response = await fetch(url);
	 *
	 *		setHeaders({
	 *			age: response.headers.get('age'),
	 *			'cache-control': response.headers.get('cache-control')
	 *		});
	 *
	 *		return response.json();
	 *	}
	 *	```
	 *
	 * 同じヘッダーを複数回設定することは (たとえ別々の `load` 関数であっても) エラーとなります。指定したヘッダーを設定できるのは一度だけです。
	 *
	 * `set-cookie` ヘッダーは、`setHeaders` では追加できません。代わりに、サーバー `load` 関数で [`cookies`](https://kit.svelte.jp/docs/types#public-types-cookies) API を使用してください。
	 *
	 * ブラウザで `load` 関数を実行している場合、`setHeaders` には何の効果もありません。
	 */
	setHeaders(headers: Record<string, string>): void;
	/**
	 * `await parent()` は、親の `+layout.js` の `load` 関数から data を返します。
	 * `+layout.js` が存在しない場合は、暗黙的に `({ data }) => data` 関数として扱われます。つまり、親の `+layout.server.js` ファイルから data を返したり転送します。
	 *
	 * `await parent()` を使用する場合、偶発的なウォーターフォールを引き起こさないようにご注意ください。例えば、親の data を戻り値にマージしたいだけであれば、他のデータを取得したあとにこれを呼び出すようにしてください。
	 */
	parent(): Promise<ParentData>;
	/**
	 * この関数は、`load` 関数が1つ以上の URL またはカスタムの識別子に依存していることを宣言します。この依存関係は、あとで [`invalidate()`](/docs/modules#$app-navigation-invalidate) で `load` を再実行させるのに使用されます。
	 *
	 * `fetch` はあなたの代わりに `depends` を呼び出すので、ほとんどの場合これは必要ありません。必要になるのは、`fetch` をバイパスするカスタムの API クライアントを使用している場合のみです。
	 *
	 * URL はロードされるページに対して絶対パスか相対パスで、[エンコード](https://developer.mozilla.org/ja/docs/Glossary/percent-encoding)されている必要があります。
	 *
	 * カスタムの識別子は、[URI 仕様](https://www.rfc-editor.org/rfc/rfc3986.html) に準拠するため、1つ以上の小文字で始まり、それに続いてコロンを付ける必要があります。
	 *
	 * 以下の例では、`depends` を使用してカスタムの識別子を依存関係に登録する方法を示しています。これにより、ボタンがクリックされると `invalidate` が実行され、`load` 関数が再実行されます。
	 *
	 * ```js
	 * /// file: src/routes/+page.js
	 * let count = 0;
	 * export async function load({ depends }) {
	 * 	depends('increase:count');
	 *
	 * 	return { count: count++ };
	 * }
	 * ```
	 *
	 * ```html
	 * /// file: src/routes/+page.svelte
	 * <script>
	 * 	import { invalidate } from '$app/navigation';
	 *
	 * 	export let data;
	 *
	 * 	const increase = async () => {
	 * 		await invalidate('increase:count');
	 * 	}
	 * </script>
	 *
	 * <p>{data.count}<p>
	 * <button on:click={increase}>Increase Count</button>
	 * ```
	 */
	depends(...deps: string[]): void;
}

export interface NavigationEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	RouteId extends string | null = string | null
> {
	/**
	 * The parameters of the current page - e.g. for a route like `/blog/[slug]`, a `{ slug: string }` object
	 */
	params: Params;
	/**
	 * Info about the current route
	 */
	route: {
		/**
		 * The ID of the current route - e.g. for `src/routes/blog/[slug]`, it would be `/blog/[slug]`
		 */
		id: RouteId;
	};
	/**
	 * The URL of the current page
	 */
	url: URL;
}

/**
 * Information about the target of a specific navigation.
 */
export interface NavigationTarget {
	/**
	 * Parameters of the target page - e.g. for a route like `/blog/[slug]`, a `{ slug: string }` object.
	 * Is `null` if the target is not part of the SvelteKit app (could not be resolved to a route).
	 */
	params: Record<string, string> | null;
	/**
	 * Info about the target route
	 */
	route: { id: string | null };
	/**
	 * The URL that is navigated to
	 */
	url: URL;
}

/**
 * - `enter`: The app has hydrated
 * - `form`: The user submitted a `<form>`
 * - `leave`: The user is leaving the app by closing the tab or using the back/forward buttons to go to a different document
 * - `link`: Navigation was triggered by a link click
 * - `goto`: Navigation was triggered by a `goto(...)` call or a redirect
 * - `popstate`: Navigation was triggered by back/forward navigation
 */
export type NavigationType = 'enter' | 'form' | 'leave' | 'link' | 'goto' | 'popstate';

export interface Navigation {
	/**
	 * ナビゲーションがトリガーされた場所
	 */
	from: NavigationTarget | null;
	/**
	 * ナビゲーションの行き先/行った先
	 */
	to: NavigationTarget | null;
	/**
	 * ナビゲーションのタイプ:
	 * - `form`: ユーザーが `<form>` を送信した場合
	 * - `leave`: ユーザーがタブを閉じようとしたり 戻る/進む ボタンで違うドキュメントに行こうとしてアプリから離れようとした場合
	 * - `link`: リンクがクリックされてナビゲーションがトリガーされた場合
	 * - `goto`: `goto(...)` をコール、またはリダイレクトによってナビゲーションがトリガーされた場合
	 * - `popstate`: 戻る/進む によってナビゲーションがトリガーされた場合
	 */
	type: Omit<NavigationType, 'enter'>;
	/**
	 * ナビゲーションの結果、ページがアンロードされるかどうか (すなわちクライアントサイドナビゲーションではない)
	 */
	willUnload: boolean;
	/**
	 * ヒストリーの 戻る/進む ナビゲーションの場合、戻る/進むのステップ数
	 */
	delta?: number;
}

/**
 * [`beforeNavigate`](https://kit.svelte.jp/docs/modules#$app-navigation-beforenavigate) コールバックに渡される引数です。
 */
export interface BeforeNavigate extends Navigation {
	/**
	 * ナビゲーションを開始しないようにするためには、これを呼び出してください。
	 */
	cancel(): void;
}

/**
 * [`afterNavigate`](https://kit.svelte.jp/docs/modules#$app-navigation-afternavigate) コールバックに渡される引数です。
 */
export interface AfterNavigate extends Navigation {
	/**
	 * ナビゲーションのタイプ:
	 * - `enter`: アプリがハイドレーションされた場合
	 * - `form`: ユーザーが `<form>` を送信した場合
	 * - `link`: リンクをクリックしてナビゲーションがトリガーされた場合
	 * - `goto`: `goto(...)` をコール、またはリダイレクトによってナビゲーションがトリガーされた場合
	 * - `popstate`: 戻る/進む によってナビゲーションがトリガーされた場合
	 */
	type: Omit<NavigationType, 'leave'>;
	/**
	 * `afterNavigate` はナビゲーションの完了後に呼び出されるため、ページをアンロードするナビゲーションでは決して呼び出されません。
	 */
	willUnload: false;
}

/**
 * The shape of the `$page` store
 */
export interface Page<
	Params extends Record<string, string> = Record<string, string>,
	RouteId extends string | null = string | null
> {
	/**
	 * The URL of the current page
	 */
	url: URL;
	/**
	 * The parameters of the current page - e.g. for a route like `/blog/[slug]`, a `{ slug: string }` object
	 */
	params: Params;
	/**
	 * Info about the current route
	 */
	route: {
		/**
		 * The ID of the current route - e.g. for `src/routes/blog/[slug]`, it would be `/blog/[slug]`
		 */
		id: RouteId;
	};
	/**
	 * Http status code of the current page
	 */
	status: number;
	/**
	 * The error object of the current page, if any. Filled from the `handleError` hooks.
	 */
	error: App.Error | null;
	/**
	 * The merged result of all data from all `load` functions on the current page. You can type a common denominator through `App.PageData`.
	 */
	data: App.PageData & Record<string, any>;
	/**
	 * Filled only after a form submission. See [form actions](https://kit.svelte.jp/docs/form-actions) for more info.
	 */
	form: any;
}

/**
 * The shape of a param matcher. See [matching](https://kit.svelte.jp/docs/advanced-routing#matching) for more info.
 */
export interface ParamMatcher {
	(param: string): boolean;
}

export interface RequestEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	RouteId extends string | null = string | null
> {
	/**
	 * Get or set cookies related to the current request
	 */
	cookies: Cookies;
	/**
	 * `fetch` is equivalent to the [native `fetch` web API](https://developer.mozilla.org/en-US/docs/Web/API/fetch), with a few additional features:
	 *
	 * - it can be used to make credentialed requests on the server, as it inherits the `cookie` and `authorization` headers for the page request
	 * - it can make relative requests on the server (ordinarily, `fetch` requires a URL with an origin when used in a server context)
	 * - internal requests (e.g. for `+server.js` routes) go directly to the handler function when running on the server, without the overhead of an HTTP call
	 *
	 * > Cookies will only be passed through if the target host is the same as the SvelteKit application or a more specific subdomain of it.
	 */
	fetch: typeof fetch;
	/**
	 * The client's IP address, set by the adapter.
	 */
	getClientAddress(): string;
	/**
	 * Contains custom data that was added to the request within the [`handle hook`](https://kit.svelte.jp/docs/hooks#server-hooks-handle).
	 */
	locals: App.Locals;
	/**
	 * The parameters of the current page or endpoint - e.g. for a route like `/blog/[slug]`, a `{ slug: string }` object
	 */
	params: Params;
	/**
	 * Additional data made available through the adapter.
	 */
	platform: Readonly<App.Platform> | undefined;
	/**
	 * The original request object
	 */
	request: Request;
	/**
	 * Info about the current route
	 */
	route: {
		/**
		 * The ID of the current route - e.g. for `src/routes/blog/[slug]`, it would be `/blog/[slug]`
		 */
		id: RouteId;
	};
	/**
	 * If you need to set headers for the response, you can do so using the this method. This is useful if you want the page to be cached, for example:
	 *
	 *	```js
	 *	/// file: src/routes/blog/+page.js
	 *	export async function load({ fetch, setHeaders }) {
	 *		const url = `https://cms.example.com/articles.json`;
	 *		const response = await fetch(url);
	 *
	 *		setHeaders({
	 *			age: response.headers.get('age'),
	 *			'cache-control': response.headers.get('cache-control')
	 *		});
	 *
	 *		return response.json();
	 *	}
	 *	```
	 *
	 * Setting the same header multiple times (even in separate `load` functions) is an error — you can only set a given header once.
	 *
	 * You cannot add a `set-cookie` header with `setHeaders` — use the [`cookies`](https://kit.svelte.jp/docs/types#public-types-cookies) API instead.
	 */
	setHeaders(headers: Record<string, string>): void;
	/**
	 * The URL of the current page or endpoint.
	 */
	url: URL;
	/**
	 * `true` if the request comes from the client asking for `+page/layout.server.js` data. The `url` property will be stripped of the internal information
	 * related to the data request in this case. Use this property instead if the distinction is important to you.
	 */
	isDataRequest: boolean;
}

/**
 * `(event: RequestEvent) => Response` という関数で、`+server.js` ファイルからエクスポートされます。HTTP verb (`GET`, `PUT`, `PATCH`, etc) に対応しており、それぞれの HTTP メソッドのリクエストを処理します。
 *
 * 1つめのジェネリックな引数(first generic argument)として `Params` を受け取りますが、代わりに [generated types](https://kit.svelte.jp/docs/types#generated-types) を使うことでこれをスキップすることができます。
 */
export interface RequestHandler<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	RouteId extends string | null = string | null
> {
	(event: RequestEvent<Params, RouteId>): MaybePromise<Response>;
}

export interface ResolveOptions {
	/**
	 * Applies custom transforms to HTML. If `done` is true, it's the final chunk. Chunks are not guaranteed to be well-formed HTML
	 * (they could include an element's opening tag but not its closing tag, for example)
	 * but they will always be split at sensible boundaries such as `%sveltekit.head%` or layout/page components.
	 * @param input the html chunk and the info if this is the last chunk
	 */
	transformPageChunk?(input: { html: string; done: boolean }): MaybePromise<string | undefined>;
	/**
	 * Determines which headers should be included in serialized responses when a `load` function loads a resource with `fetch`.
	 * By default, none will be included.
	 * @param name header name
	 * @param value header value
	 */
	filterSerializedResponseHeaders?(name: string, value: string): boolean;
	/**
	 * Determines what should be added to the `<head>` tag to preload it.
	 * By default, `js`, `css` and `font` files will be preloaded.
	 * @param input the type of the file and its path
	 */
	preload?(input: { type: 'font' | 'css' | 'js' | 'asset'; path: string }): boolean;
}

export class Server {
	constructor(manifest: SSRManifest);
	init(options: ServerInitOptions): Promise<void>;
	respond(request: Request, options: RequestOptions): Promise<Response>;
}

export interface ServerInitOptions {
	env: Record<string, string>;
}

export interface SSRManifest {
	appDir: string;
	appPath: string;
	assets: Set<string>;
	mimeTypes: Record<string, string>;

	/** private fields */
	_: {
		entry: {
			file: string;
			imports: string[];
			stylesheets: string[];
			fonts: string[];
		};
		nodes: SSRNodeLoader[];
		routes: SSRRoute[];
		matchers(): Promise<Record<string, ParamMatcher>>;
	};
}

/**
 * `PageServerLoad` と `LayoutServerLoad` のジェネリックなフォームです。`ServerLoad` を直接使用するのではなく、`./$types` ([generated types](https://kit.svelte.jp/docs/types#generated-types) を参照) から
 * インポートしてください。
 */
export interface ServerLoad<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	ParentData extends Record<string, any> = Record<string, any>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> {
	(event: ServerLoadEvent<Params, ParentData, RouteId>): MaybePromise<OutputData>;
}

export interface ServerLoadEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	ParentData extends Record<string, any> = Record<string, any>,
	RouteId extends string | null = string | null
> extends RequestEvent<Params, RouteId> {
	/**
	 * `await parent()` returns data from parent `+layout.server.js` `load` functions.
	 *
	 * Be careful not to introduce accidental waterfalls when using `await parent()`. If for example you only want to merge parent data into the returned output, call it _after_ fetching your other data.
	 */
	parent(): Promise<ParentData>;
	/**
	 * This function declares that the `load` function has a _dependency_ on one or more URLs or custom identifiers, which can subsequently be used with [`invalidate()`](/docs/modules#$app-navigation-invalidate) to cause `load` to rerun.
	 *
	 * Most of the time you won't need this, as `fetch` calls `depends` on your behalf — it's only necessary if you're using a custom API client that bypasses `fetch`.
	 *
	 * URLs can be absolute or relative to the page being loaded, and must be [encoded](https://developer.mozilla.org/en-US/docs/Glossary/percent-encoding).
	 *
	 * Custom identifiers have to be prefixed with one or more lowercase letters followed by a colon to conform to the [URI specification](https://www.rfc-editor.org/rfc/rfc3986.html).
	 *
	 * The following example shows how to use `depends` to register a dependency on a custom identifier, which is `invalidate`d after a button click, making the `load` function rerun.
	 *
	 * ```js
	 * /// file: src/routes/+page.js
	 * let count = 0;
	 * export async function load({ depends }) {
	 * 	depends('increase:count');
	 *
	 * 	return { count: count++ };
	 * }
	 * ```
	 *
	 * ```html
	 * /// file: src/routes/+page.svelte
	 * <script>
	 * 	import { invalidate } from '$app/navigation';
	 *
	 * 	export let data;
	 *
	 * 	const increase = async () => {
	 * 		await invalidate('increase:count');
	 * 	}
	 * </script>
	 *
	 * <p>{data.count}<p>
	 * <button on:click={increase}>Increase Count</button>
	 * ```
	 */
	depends(...deps: string[]): void;
}

/**
 * `+page.server.js` にある `export const actions = {..}` の一部である form action メソッドの形です。
 * 詳細は [form actions](https://kit.svelte.jp/docs/form-actions) をご参照ください。
 */
export interface Action<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> {
	(event: RequestEvent<Params, RouteId>): MaybePromise<OutputData>;
}

/**
 * `+page.server.js` にある `export const actions = {..}` オブジェクトの形です。
 * 詳細は [form actions](https://kit.svelte.jp/docs/form-actions) をご参照ください。
 */
export type Actions<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> = Record<string, Action<Params, OutputData, RouteId>>;

/**
 * fetch を通じて form action を呼び出したとき、そのレスポンスはこれらの形となります。
 */
export type ActionResult<
	Success extends Record<string, unknown> | undefined = Record<string, any>,
	Invalid extends Record<string, unknown> | undefined = Record<string, any>
> =
	| { type: 'success'; status: number; data?: Success }
	| { type: 'failure'; status: number; data?: Invalid }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: any };

/**
 * HTTP ステータスコードとオプションのメッセージで `HttpError` オブジェクトを作成します。
 * リクエストの処理中にこのオブジェクトがスローされると、SvelteKit は
 * `handleError` を呼ばずにエラーレスポンス(error response)を返します。
 * スローされた redirect をキャッチしないようにしてください、意味がなくなります。
 * @param status [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#client_error_responses)、400-599 の範囲内でなければならない。
 * @param body App.Error 型に準拠するオブジェクト。string が渡された場合、メッセージプロパティとして使用される。
 */
export function error(status: number, body: App.Error): HttpError;
export function error(
	status: number,
	// this overload ensures you can omit the argument or pass in a string if App.Error is of type { message: string }
	body?: { message: string } extends App.Error ? App.Error | string | undefined : never
): HttpError;

/**
 * [`error`](https://kit.svelte.jp/docs/modules#sveltejs-kit-error) 関数が返すオブジェクトです
 */
export interface HttpError {
	/** [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#client_error_responses)、400-599 の範囲内。 */
	status: number;
	/** エラーのコンテンツ */
	body: App.Error;
}

/**
 * `Redirect` オブジェクトを作成します。リクエストの処理中にスローされると、SvelteKit はリダイレクトレスポンス(redirect response)を返します。
 * スローされた redirect をキャッチしないようにしてください、意味がなくなります。
 * @param status [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#redirection_messages)。300-308 の範囲内でなければならない。
 * @param location リダイレクト先のロケーション。
 */
export function redirect(
	status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308,
	location: string
): Redirect;

/**
 * [`redirect`](https://kit.svelte.jp/docs/modules#sveltejs-kit-redirect) 関数が返すオブジェクトです
 */
export interface Redirect {
	/** The [HTTP status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#redirection_messages), in the range 300-308. */
	status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;
	/** The location to redirect to. */
	location: string;
}

/**
 * 与えられた data から JSON `Response` オブジェクトを作成します。
 * @param data The value that will be serialized as JSON.
 * @param init Options such as `status` and `headers` that will be added to the response. `Content-Type: application/json` and `Content-Length` headers will be added automatically.
 */
export function json(data: any, init?: ResponseInit): Response;

/**
 * Create a `Response` object from the supplied body.
 * @param body The value that will be used as-is.
 * @param init Options such as `status` and `headers` that will be added to the response. A `Content-Length` header will be added automatically.
 */
export function text(body: string, init?: ResponseInit): Response;

/**
 * `ActionFailure` オブジェクトを作成します。
 * @param status [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#client_error_responses)。400-599 の範囲内でなければならない。
 * @param data 失敗(failure)に関連するデータ (例: validation errors)
 */
export function fail<T extends Record<string, unknown> | undefined>(
	status: number,
	data?: T
): ActionFailure<T>;

/**
 * [`fail`](https://kit.svelte.jp/docs/modules#sveltejs-kit-fail) 関数が返すオブジェクトです
 */
export interface ActionFailure<T extends Record<string, unknown> | undefined = undefined>
	extends UniqueInterface {
	/** [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#client_error_responses)、400-599 の範囲内。 */
	status: number;
	/** 失敗(failure)に関連するデータ (例: validation errors) */
	data: T;
}

export interface SubmitFunction<
	Success extends Record<string, unknown> | undefined = Record<string, any>,
	Invalid extends Record<string, unknown> | undefined = Record<string, any>
> {
	(input: {
		action: URL;
		data: FormData;
		form: HTMLFormElement;
		controller: AbortController;
		cancel(): void;
	}): MaybePromise<
		| void
		| ((opts: {
				form: HTMLFormElement;
				action: URL;
				result: ActionResult<Success, Invalid>;
				/**
				 * Call this to get the default behavior of a form submission response.
				 * @param options Set `reset: false` if you don't want the `<form>` values to be reset after a successful submission.
				 */
				update(options?: { reset: boolean }): Promise<void>;
		  }) => void)
	>;
}
