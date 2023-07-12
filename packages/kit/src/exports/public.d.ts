import 'svelte'; // pick up `declare module "*.svelte"`
import 'vite/client'; // pick up `declare module "*.jpg"`, etc.
import '../types/ambient.js';

import { CompileOptions } from 'svelte/types/compiler/interfaces';
import {
	AdapterEntry,
	CspDirectives,
	HttpMethod,
	Logger,
	MaybePromise,
	Prerendered,
	PrerenderEntryGeneratorMismatchHandlerValue,
	PrerenderHttpErrorHandlerValue,
	PrerenderMissingIdHandlerValue,
	PrerenderOption,
	RequestOptions,
	RouteSegment
} from '../types/private.js';
import { ActionFailure } from '../runtime/control.js';
import { BuildData, SSRNodeLoader, SSRRoute, ValidatedConfig } from 'types';
import type { PluginOptions } from '@sveltejs/vite-plugin-svelte';

export { PrerenderOption } from '../types/private.js';
export { ActionFailure };

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

export type AwaitedActions<T extends Record<string, (...args: any) => any>> = OptionalUnion<
	{
		[Key in keyof T]: UnpackValidationError<Awaited<ReturnType<T[Key]>>>;
	}[keyof T]
>;

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
	/** 全てのルート (プリレンダリングされたものも含む) の配列です */
	routes: RouteDefinition[];

	/**
	 * アプリの1つ以上のルート(routes)にマップする別の関数を作成します。
	 * @param fn 一連のルート(routes)をエントリーポイントにまとめる関数
	 * @deprecated Use `builder.routes` instead
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
	generateManifest(opts: { relativePath: string; routes?: RouteDefinition[] }): string;

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
	 * [`svelte.compile`](https://svelte.jp/docs#compile-time-svelte-compile) に渡されるオプションです。
	 * @default {}
	 */
	compilerOptions?: CompileOptions;
	/**
	 * Svelte ファイルとして扱うべきファイルの拡張子のリストです。
	 * @default [".svelte"]
	 */
	extensions?: string[];
	/** SvelteKit オプション */
	kit?: KitConfig;
	/** [`@sveltejs/package`](/docs/packaging) オプション。 */
	package?: {
		source?: string;
		dir?: string;
		emitTypes?: boolean;
		exports?(filepath: string): boolean;
		files?(filepath: string): boolean;
	};
	/** プリプロセッサ のオプション (もしあれば)。プリプロセスは Vite のプリプロセッサによって行うこともできます。 */
	preprocess?: any;
	/** `vite-plugin-svelte` プラグインオプション。 */
	vitePlugin?: PluginOptions;
	/** Svelte とインテグレートするツールに必要な追加のオプション。 */
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
	 * 事前に `cookies.set` で設定されたすべての cookie や、またはリクエストヘッダーからすべての cookie を取得します。
	 * @param opts 直接 `cookie.parse` に直接渡されるオプションです。ドキュメントは[こちら](https://github.com/jshttp/cookie#cookieparsestr-options)
	 */
	getAll(opts?: import('cookie').CookieParseOptions): Array<{ name: string; value: string }>;

	/**
	 * cookie を設定します。これはレスポンスに `set-cookie` ヘッダーを追加し、また、現在のリクエスト中に `cookies.get` か `cookies.getAll` を通じてその cookie を利用可能にします。
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
	 *
	 * もしこのレベルの設定では不十分で、より動的な要件がある場合は、[`handle` hook](https://kit.svelte.jp/docs/hooks#server-hooks-handle) を使用して独自の CSP を動かすことができます。
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
	 * [cross-site request forgery (CSRF)](https://owasp.org/www-community/attacks/csrf) 攻撃からの防御の設定です。
	 */
	csrf?: {
		/**
		 * `POST`、`PUT`、`PATCH`、`DELETE` でのフォーム送信時、受信した `origin` ヘッダーをチェックしてサーバーのオリジン(origin)と一致するか検証することを行うかどうか。
		 *
		 * あなたのアプリに対し、別のオリジンから `POST`、`PUT`、`PATCH`、`DELETE` のリクエスト (`Content-Type` は `application/x-www-form-urlencoded`、`multipart/form-data`、`text/plain` のいずれか) をできるようにするには、このオプションを無効にする必要があります。ご注意を!
		 * @default true
		 */
		checkOrigin?: boolean;
	};
	/**
	 * Here be dragons. Enable at your peril.
	 */
	dangerZone?: {
		/**
		 * Automatically add server-side `fetch`ed URLs to the `dependencies` map of `load` functions. This will expose secrets
		 * to the client if your URL contains them.
		 */
		trackServerFetches?: boolean;
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
		/**
		 * A prefix that signals that an environment variable is unsafe to expose to client-side code. Environment variables matching neither the public nor the private prefix will be discarded completely. See [`$env/static/private`](/docs/modules#$env-static-private) and [`$env/dynamic/private`](/docs/modules#$env-dynamic-private).
		 * @default ""
		 */
		privatePrefix?: string;
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
	/**
	 * ビルドの出力フォーマットに関するオプション
	 */
	output?: {
		/**
		 * SvelteKit は初期ページに必要な JavaScript モジュールをプリロードすることで、インポートの 'ウォーターフォール' を回避し、アプリケーションの起動を高速化します。
		 * 異なるトレードオフを持つ3つの戦略があります:
		 * - `modulepreload` - `<link rel="modulepreload">` を使用します。これは Chromium ベースのブラウザ、Firefox 115 以上、Safari 17 以上ではベストな結果をもたらします。古いブラウザでは無視されます。
		 * - `preload-js` - `<link rel="preload">` を使用します。Chromium と Safari でウォーターフォールを防ぎますが、Chromium は書くモジュールを2回パースします (script として1回、module として1回)。Firefox ではモジュールが2回リクエストされるようになります。これは、Chromium ユーザーのパフォーマンスをわずかに低下させるのと引き換えに、iOS デバイスのユーザーのパフォーマンスを最大化したい場合には有効な設定です。
		 * - `preload-mjs` - `<link rel="preload">` を使用しますが、`.mjs` 拡張子であるため、Chromium が二重でパースすることを防ぎます。一部の静的 Web サーバーでは、.mjs ファイルを `Content-Type: application/javascript` ヘッダーとともに提供すると失敗となり、アプリケーションを壊すことになります。それがもしあなたにあてはまらないのなら、`modulepreload` がより広くサポートされるまで、これが多くのユーザーにベストなパフォーマンスをもたらすオプションです。
		 * @default "modulepreload"
		 */
		preloadStrategy?: 'modulepreload' | 'preload-js' | 'preload-mjs';
	};
	paths?: {
		/**
		 * アプリのファイルが提供される絶対パス(absolute path)です。これは、何らかのストレージバケットからファイルを提供する場合に有用です。
		 * @default ""
		 */
		assets?: '' | `http://${string}` | `https://${string}`;
		/**
		 * ルート相対なパス(root-relative path)です。空文字(empty string)以外を指定する場合、先頭は `/` を付ける必要があり、末尾には `/` を付けてはいけません (例: `/base-path`)。アプリがどこから提供されるかを指定することで、アプリをルートではないパス(non-root path)で動作させることができます。ルート相対(root-relative)なリンクには、先頭に base の値を追加しなければなりません。そうしないとリンクが `base` ではなくドメインのルート(root)を指してしまいます(これはブラウザの動作によるものです)。これを行うには、[`base` from `$app/paths`](/docs/modules#$app-paths-base) をインポートして `<a href="{base}/your-page">Link</a>` のようにします。もし、これを頻繁に書くようであれば、再利用可能なコンポーネントに抽出するのも良いでしょう。
		 * @default ""
		 */
		base?: '' | `/${string}`;
		/**
		 * 相対アセットパスを使うかどうか。デフォルトでは、`paths.assets` が外部ではない場合、SvelteKit は `%sveltekit.assets%` を相対パスに置き換え、ビルド成果物の参照に対する相対パスを使用しますが、`$app/paths` からインポートする `base` と `assets` は、あなたの設定で指定された通りになります。
		 *
		 * `true` の場合、`$app/paths` からインポートする `base` と `assets` は、サーバーサイドレンダリング中に相対アセットパスに置き換えられ、ポータブルな HTML になります。
		 * `false` の場合、`%sveltekit.assets%` とビルド成果物への参照は、`paths.assets` が外部 URL でない限り、常にルート相対(root-relative)なパスとなります。
		 *
		 * もしアプリで `<base>` 要素を使用している場合、これを `false` に設定してください。そうしないとアセットの URL が誤って現在のページではなく `<base>` URL に対して解決されてしまいます。
		 * @default undefined
		 */
		relative?: boolean | undefined;
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
		 * /// file: svelte.config.js
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
		 * `entries` エクスポートで生成されたエントリーが、生成されたルート(route)とマッチしない場合の応答方法。
		 *
		 * - `'fail'` — ビルドを失敗させます
		 * - `'ignore'` - 失敗(failure)を無視して継続させます
		 * - `'warn'` — 継続しますが、警告(warning)をプリントします
		 * - `(details) => void` — `generatedFromId`、`entry`、`matchedId`、`message` プロパティを持つ `details` オブジェクトを引数に取るカスタムのエラーハンドラです。この関数から `throw` されると、ビルドが失敗します
		 *
		 * @default "fail"
		 */
		handleEntryGeneratorMismatch?: PrerenderEntryGeneratorMismatchHandlerValue;
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
		 * This is useful for extending a shared `tsconfig.json` in a monorepo root, for example.
		 * @default (config) => config
		 */
		config?: (config: Record<string, any>) => Record<string, any> | void;
	};
	/**
	 * アプリが使用されているときにアプリの新しいバージョンをデプロイするとクライアントサイドのナビゲーションにバグが発生することがあります。次に開くページのコードがすでにロードされている場合、そこに古いコンテンツがある可能性があります。そうでなくとも、アプリのルートマニフェスト(route manifest)が、もう存在しない JavaScript ファイルを指している可能性があります。
	 * SvelteKit はバージョン管理によってこの問題を解決します。
	 * SvelteKit がページの読込中にエラーに遭遇し、新しいバージョンがデプロイされていることを検知した場合 (ここで指定される `name` を使用します。デフォルトはビルドのタイムスタンプです)、従来のフルページナビゲーションにフォールバックされます。
	 * しかし、すべてのナビゲーションがエラーとなるわけではありません。例えば次のページの JavaScript がすでに読み込まれている場合です。このような場合でもフルページナビゲーションを強制したい場合は、`pollInterval` を設定してから `beforeNavigate` を使用する、などのテクニックを使用します:
	 * ```html
	 * /// file: +layout.svelte
	 * <script>
	 *   import { beforeNavigate } from '$app/navigation';
	 *   import { updated } from '$app/stores';
	 *
	 *   beforeNavigate(({ willUnload, to }) => {
	 *     if ($updated && !willUnload && to?.url) {
	 *       location.href = to.url.href;
	 *     }
	 *   });
	 * </script>
	 * ```
	 *
	 * `pollInterval` を 0 以外の値に設定した場合、SvelteKit はバックグラウンドで新しいバージョンをポーリングし、それを検知すると [`updated`](/docs/modules#$app-stores-updated) ストアの値を `true` にします。
	 */
	version?: {
		/**
		 * アプリの現在のバージョンの文字列です。これを指定する場合は、決定論的なものでないといけません (例えば `Math.random()` や `Date.now().toString()` ではなく commit ref )。指定しない場合は、ビルドのタイムスタンプがデフォルトとなります
		 *
		 * 例えば、現在のコミットハッシュを使用するには、`git rev-parse HEAD` を使用することができます:
		 *
		 * ```js
		 * /// file: svelte.config.js
		 * import * as child_process from 'node:child_process';
		 *
		 * export default {
		 *   kit: {
		 *     version: {
		 *       name: child_process.execSync('git rev-parse HEAD').toString().trim()
		 *     }
		 *   }
		 * };
		 * ```
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
export type Handle = (input: {
	event: RequestEvent;
	resolve(event: RequestEvent, opts?: ResolveOptions): MaybePromise<Response>;
}) => MaybePromise<Response>;

/**
 * サーバーサイドの [`handleError`](https://kit.svelte.jp/docs/hooks#shared-hooks-handleerror) hook は、リクエストの応答中に予期せぬエラー(unexpected error)がスローされたときに実行されます。
 *
 * もし予期せぬエラーが load か レンダリング中にスローされた場合、この関数はその error と event を引数に取って呼び出されます。
 * この関数では決してエラーをスローしないようにしてください。
 */
export type HandleServerError = (input: {
	error: unknown;
	event: RequestEvent;
}) => MaybePromise<void | App.Error>;

/**
 * クライアントサイドの [`handleError`](https://kit.svelte.jp/docs/hooks#shared-hooks-handleerror) hook は、ナビゲーション中に予期せぬエラー(unexpected error)がスローされたときに実行されます。
 *
 * もし予期せぬエラーが load かその後のレンダリング中にスローされた場合、この関数はその error と error と event を引数に取って呼び出されます。
 * この関数では決してエラーをスローしないようにしてください。
 */
export type HandleClientError = (input: {
	error: unknown;
	event: NavigationEvent;
}) => MaybePromise<void | App.Error>;

/**
 * [`handleFetch`](https://kit.svelte.jp/docs/hooks#server-hooks-handlefetch) hook によって、サーバーで(またはプリレンダリング中に)実行される `load` 関数の内側で実行される `fetch` リクエストを変更 (または置換) することができます
 */
export type HandleFetch = (input: {
	event: RequestEvent;
	request: Request;
	fetch: typeof fetch;
}) => MaybePromise<Response>;

/**
 * `PageLoad` と `LayoutLoad` のジェネリックなフォームです。`Load` を直接使用するのではなく、`./$types` ([generated types](https://kit.svelte.jp/docs/types#generated-types) 参照) から
 * インポートしてください。
 */
export type Load<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	InputData extends Record<string, unknown> | null = Record<string, any> | null,
	ParentData extends Record<string, unknown> = Record<string, any>,
	OutputData extends Record<string, unknown> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> = (event: LoadEvent<Params, InputData, ParentData, RouteId>) => MaybePromise<OutputData>;

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
	 * 現在のページのパラメータ - 例えば `/blog/[slug]` というルート(route)の場合は、`{ slug: string }` オブジェクト
	 */
	params: Params;
	/**
	 * 現在のルート(route)に関する情報
	 */
	route: {
		/**
		 * 現在のルート(route)の ID - 例えば `src/routes/blog/[slug]` の場合は、`/blog/[slug]` となる
		 */
		id: RouteId;
	};
	/**
	 * 現在のページの URL
	 */
	url: URL;
}

/**
 * 特定のナビゲーションのターゲットに関する情報
 */
export interface NavigationTarget {
	/**
	 * ターゲットページのパラメータ - 例えば `/blog/[slug]` というルート(route)の場合、`{ slug: string }` オブジェクト。
	 * ターゲットが SvelteKit アプリではない場合 (ルート(route)として解決できない場合) は `null` となる。
	 */
	params: Record<string, string> | null;
	/**
	 * ターゲットのルート(route)に関する情報
	 */
	route: { id: string | null };
	/**
	 * ナビゲーション先の URL
	 */
	url: URL;
}

/**
 * - `enter`: アプリがハイドレーションされた場合
 * - `form`: ユーザーが GET メソッドで `<form>` を送信した場合
 * - `leave`: ユーザーがタブを閉じようとしたり 戻る/進む ボタンで違うドキュメントに行こうとしてアプリから離れようとした場合
 * - `link`: リンクをクリックしてナビゲーションがトリガーされた場合
 * - `goto`: `goto(...)` をコール、またはリダイレクトによってナビゲーションがトリガーされた場合
 * - `popstate`: 戻る/進む によってナビゲーションがトリガーされた場合
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
 * `$page` store の形です
 */
export interface Page<
	Params extends Record<string, string> = Record<string, string>,
	RouteId extends string | null = string | null
> {
	/**
	 * 現在のページの URL
	 */
	url: URL;
	/**
	 * 現在のページのパラメータ - 例えば `/blog/[slug]` というルート(route)の場合は、`{ slug: string }` オブジェクト
	 */
	params: Params;
	/**
	 * 現在のルート(route)に関する情報
	 */
	route: {
		/**
		 * 現在のルート(route)の ID - 例えば `src/routes/blog/[slug]` の場合、`/blog/[slug]` となる
		 */
		id: RouteId;
	};
	/**
	 * 現在のページの Http ステータスコード
	 */
	status: number;
	/**
	 * 現在のページのエラーオブジェクト(存在する場合)。`handleError` hook から注入される。
	 */
	error: App.Error | null;
	/**
	 * 現在のページにおいて、全ての `load` 関数からの全ての data がマージされた結果。共通の部分については `App.PageData` を通じて型付けできます。
	 */
	data: App.PageData & Record<string, any>;
	/**
	 * form が送信された後にのみ注入される。詳細については [form actions](https://kit.svelte.jp/docs/form-actions) を参照。
	 */
	form: any;
}

/**
 * param matcher の形です。詳細については [matching](https://kit.svelte.jp/docs/advanced-routing#matching) を参照。
 */
export type ParamMatcher = (param: string) => boolean;

export interface RequestEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	RouteId extends string | null = string | null
> {
	/**
	 * 現在のリクエストに関する cookie を取得または設定する
	 */
	cookies: Cookies;
	/**
	 * `fetch` は[ネイティブの `fetch` web API](https://developer.mozilla.org/ja/docs/Web/API/fetch) と同等ですが、いくつか機能が追加されています:
	 *
	 * - ページリクエストの `cookie` と `authorization` ヘッダーを継承しているため、サーバー上で認証情報付きのリクエストを行うのに使用することができます
	 * - サーバー上で相対パスのリクエストを行うことができます (通常、`fetch` は、サーバーのコンテキストで使用する場合 origin 付きの URL が必要です)
	 * - サーバー上で実行されている場合、内部リクエスト (例えば `+server.js` ルート(routes)に対するリクエスト) は、直接ハンドラ関数を呼び出すので、HTTP を呼び出すオーバーヘッドがありません
	 *
	 * > Cookie は、ターゲットホストが SvelteKit アプリケーションと同じか、より明確・詳細(specific)なサブドメインである場合にのみ引き渡されます。
	 */
	fetch: typeof fetch;
	/**
	 * クライアントの IP アドレスで、adapter によって設定される。
	 */
	getClientAddress(): string;
	/**
	 * [`handle hook`](https://kit.svelte.jp/docs/hooks#server-hooks-handle) 内でリクエストに追加されるカスタムの data が含まれる。
	 */
	locals: App.Locals;
	/**
	 * 現在のルート(route)のパラメータ - 例えば `/blog/[slug]` というルート(route)の場合は、`{ slug: string }` オブジェクト
	 */
	params: Params;
	/**
	 * adapter を通じて利用可能になる追加の data。
	 */
	platform: Readonly<App.Platform> | undefined;
	/**
	 * オリジナルのリクエストオブジェクト
	 */
	request: Request;
	/**
	 * 現在のルート(route)に関する情報
	 */
	route: {
		/**
		 * 現在のルート(route)の ID - 例えば `src/routes/blog/[slug]` の場合、`/blog/[slug]` となる
		 */
		id: RouteId;
	};
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
	 * `set-cookie` ヘッダーは、`setHeaders` では追加できません。代わりに、[`cookies`](https://kit.svelte.jp/docs/types#public-types-cookies) API を使用してください。
	 */
	setHeaders(headers: Record<string, string>): void;
	/**
	 * リクエストされた URL。
	 */
	url: URL;
	/**
	 * クライアントから `+page/layout.server.js` の data を要求するリクエストが来た場合は `true` となります。この場合、`url` プロパティからその data へのリクエストに関する内部情報が取り除かれます。
	 * もしあなたにとってこの区別が重要な場合、このプロパティを使用してください。
	 */
	isDataRequest: boolean;
	/**
	 * `true` for `+server.js` calls coming from SvelteKit without the overhead of actually making an HTTP request. This happens when you make same-origin `fetch` requests on the server.
	 */
	isSubRequest: boolean;
}

/**
 * `(event: RequestEvent) => Response` という関数で、`+server.js` ファイルからエクスポートされます。HTTP verb (`GET`, `PUT`, `PATCH`, etc) に対応しており、それぞれの HTTP メソッドのリクエストを処理します。
 *
 * 1つめのジェネリックな引数(first generic argument)として `Params` を受け取りますが、代わりに [generated types](https://kit.svelte.jp/docs/types#generated-types) を使うことでこれをスキップすることができます。
 */
export type RequestHandler<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	RouteId extends string | null = string | null
> = (event: RequestEvent<Params, RouteId>) => MaybePromise<Response>;

export interface ResolveOptions {
	/**
	 * カスタムの変換を HTML に適用します。`done` が true である場合、それは最後のチャンクです。チャンクが整形された HTML
	 * であることは保証されませんが (例えば、要素の開始タグは含むが終了タグは含まれない、など)、
	 * 常に `%sveltekit.head%` やレイアウト(layout)/ページ(page)コンポーネントなどのような理にかなった境界 (sensible boundaries) で分割されます。
	 * @param input html のチャンクとこれが最後のチャンクかどうかの情報
	 */
	transformPageChunk?(input: { html: string; done: boolean }): MaybePromise<string | undefined>;
	/**
	 * `load` 関数が `fetch` でリソースを読み込むときに、シリアライズされるレスポンスにどのヘッダーを含めるかを決定します。
	 * デフォルトでは何も含まれません。
	 * @param name ヘッダーの名前
	 * @param value ヘッダーの値
	 */
	filterSerializedResponseHeaders?(name: string, value: string): boolean;
	/**
	 * `<head>` タグにどのファイルをプリロードの対象として追加するか決定します。
	 * デフォルトでは、`js` と `css` ファイルがプリロードされます。
	 * @param input ファイルのタイプとそのパス
	 */
	preload?(input: { type: 'font' | 'css' | 'js' | 'asset'; path: string }): boolean;
}

export interface RouteDefinition<Config = any> {
	id: string;
	api: {
		methods: HttpMethod[];
	};
	page: {
		methods: Extract<HttpMethod, 'GET' | 'POST'>[];
	};
	pattern: RegExp;
	prerender: PrerenderOption;
	segments: RouteSegment[];
	methods: HttpMethod[];
	config: Config;
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
		client: NonNullable<BuildData['client']>;
		nodes: SSRNodeLoader[];
		routes: SSRRoute[];
		matchers(): Promise<Record<string, ParamMatcher>>;
	};
}

/**
 * `PageServerLoad` と `LayoutServerLoad` のジェネリックなフォームです。`ServerLoad` を直接使用するのではなく、`./$types` ([generated types](https://kit.svelte.jp/docs/types#generated-types) を参照) から
 * インポートしてください。
 */
export type ServerLoad<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	ParentData extends Record<string, any> = Record<string, any>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> = (event: ServerLoadEvent<Params, ParentData, RouteId>) => MaybePromise<OutputData>;

export interface ServerLoadEvent<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	ParentData extends Record<string, any> = Record<string, any>,
	RouteId extends string | null = string | null
> extends RequestEvent<Params, RouteId> {
	/**
	 * `await parent()` は、親の `+layout.server.js` の `load` 関数から data を返します。
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
	 * カスタムの識別子は、[URI 仕様](https://www.rfc-editor.org/rfc/rfc3986.html)に準拠するため、1つ以上の小文字で始まり、それに続いてコロンを付ける必要があります。
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

/**
 * `+page.server.js` にある `export const actions = {..}` の一部である form action メソッドの形です。
 * 詳細は [form actions](https://kit.svelte.jp/docs/form-actions) をご参照ください。
 */
export type Action<
	Params extends Partial<Record<string, string>> = Partial<Record<string, string>>,
	OutputData extends Record<string, any> | void = Record<string, any> | void,
	RouteId extends string | null = string | null
> = (event: RequestEvent<Params, RouteId>) => MaybePromise<OutputData>;

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
 * fetch を通じて form action を呼び出したとき、そのレスポンスはこれらのうちいずれかの形となります。
 * ```svelte
 * <form method="post" use:enhance={() => {
 *   return ({ result }) => {
 * 		// result is of type ActionResult
 *   };
 * }}
 * ```
 */
export type ActionResult<
	Success extends Record<string, unknown> | undefined = Record<string, any>,
	Failure extends Record<string, unknown> | undefined = Record<string, any>
> =
	| { type: 'success'; status: number; data?: Success }
	| { type: 'failure'; status: number; data?: Failure }
	| { type: 'redirect'; status: number; location: string }
	| { type: 'error'; status?: number; error: any };

/**
 * [`error`](https://kit.svelte.jp/docs/modules#sveltejs-kit-error) 関数が返すオブジェクトです。
 */
export interface HttpError {
	/** [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#client_error_responses)、400-599 の範囲内。 */
	status: number;
	/** エラーのコンテンツ */
	body: App.Error;
}

/**
 * [`redirect`](https://kit.svelte.jp/docs/modules#sveltejs-kit-redirect) 関数が返すオブジェクトです。
 */
export interface Redirect {
	/** [HTTP ステータスコード](https://developer.mozilla.org/ja/docs/Web/HTTP/Status#redirection_messages)。300-308 の範囲内。 */
	status: 300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308;
	/** リダイレクト先のロケーション。 */
	location: string;
}

export type SubmitFunction<
	Success extends Record<string, unknown> | undefined = Record<string, any>,
	Failure extends Record<string, unknown> | undefined = Record<string, any>
> = (input: {
	action: URL;
	/**
	 * use `formData` instead of `data`
	 * @deprecated
	 */
	data: FormData;
	formData: FormData;
	/**
	 * use `formElement` instead of `form`
	 * @deprecated
	 */
	form: HTMLFormElement;
	formElement: HTMLFormElement;
	controller: AbortController;
	submitter: HTMLElement | null;
	cancel(): void;
}) => MaybePromise<
	| void
	| ((opts: {
			/**
			 * use `formData` instead of `data`
			 * @deprecated
			 */
			data: FormData;
			formData: FormData;
			/**
			 * use `formElement` instead of `form`
			 * @deprecated
			 */
			form: HTMLFormElement;
			formElement: HTMLFormElement;
			action: URL;
			result: ActionResult<Success, Failure>;
			/**
			 * これを呼び出すと、フォーム送信(form submission)のレスポンスのデフォルトの動作を取得することができます。
			 * @param options 送信(submission)に成功したあとに `<form>` の値をリセットしたくない場合は、`reset: false` を設定します。
			 */
			update(options?: { reset: boolean }): Promise<void>;
	  }) => void)
>;

/**
 * The type of `export const snapshot` exported from a page or layout component.
 */
export interface Snapshot<T = any> {
	capture: () => T;
	restore: (snapshot: T) => void;
}

export * from './index.js';
