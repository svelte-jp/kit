/**
 * `App` namespace を宣言することで、アプリ内のオブジェクトを型付けする方法を SvelteKit に伝えることが可能です。デフォルトでは、新しいプロジェクトには `src/app.d.ts` というファイルがあり、以下の内容を含んでいます:
 *
 * ```ts
 * declare global {
 * 	namespace App {
 * 		// interface Error {}
 * 		// interface Locals {}
 * 		// interface PageData {}
 * 		// interface Platform {}
 * 	}
 * }
 *
 * export {};
 * ```
 *
 * `export {}` の行がないと、このファイルは _ambient module_ として扱われてしまい、`import` 宣言を追加することができなくなります。
 * ambient な `declare module` 宣言を追加する必要がある場合は、`src/ambient.d.ts` のように別のファイルに記述してください。
 *
 * これらのインターフェースを作成することによって、`event.locals`、`event.platform`、`load` 関数の `data` を使用する際に型の安全性を確保することができます。
 */
declare namespace App {
	/**
	 * 想定されるエラーと予期せぬエラーの共通の形を定義します。想定されるエラーは `error` 関数を使用してスローされます。予期せぬエラーは `handleError` hooks で処理され、この形を返す必要があります。
	 */
	export interface Error {
		message: string;
	}

	/**
	 * `event.locals` を定義する interface です。`event.locals` は [hooks](https://kit.svelte.jp/docs/hooks) (`handle`、`handleError`)、`load` 関数(サーバーのみ)、`+server.js` ファイルからアクセスできます。
	 */
	export interface Locals {}

	/**
	 * [$page.data store](https://kit.svelte.jp/docs/modules#$app-stores-page) の共通の形、つまり全てのページ間で共有されるデータを定義します。
	 * `./$types` にある `Load` と `ServerLoad` 関数が絞り込まれます。
	 * 特定のページにしか存在しないデータについては、オプションのプロパティを使用してください。インデックスシグネチャ (`[key: string]: any`) を追加しないでください。
	 */
	export interface PageData {}

	/**
	 * adapter が `event.platform` で [プラットフォーム固有の情報](https://kit.svelte.jp/docs/adapters#platform-specific-context) を提供する場合、ここでそれを指定することができます。
	 */
	export interface Platform {}
}

declare module '$app/environment' {
	/**
	 * アプリがブラウザで動作している場合 `true` です。
	 */
	export const browser: boolean;

	/**
	 * SvelteKit はビルド時にアプリを実行し、アプリを解析します。このプロセス中は、`building` は `true` です。これはプリレンダリング中にも適用されます。
	 */
	export const building: boolean;

	/**
	 * 開発サーバーが動作しているかどうか。`NODE_ENV` や `MODE` に対応しているかどうかは保証されません。
	 */
	export const dev: boolean;

	/**
	 * `config.kit.version.name` の値です。
	 */
	export const version: string;
}

declare module '$app/forms' {
	import type { ActionResult } from '@sveltejs/kit';

	type MaybePromise<T> = T | Promise<T>;

	// this is duplicated in @sveltejs/kit because create-svelte tests fail
	// if we use the imported version. See https://github.com/sveltejs/kit/pull/7003#issuecomment-1330921789
	// for why this happens (it's likely a bug in TypeScript, but one that is so rare that it's unlikely to be fixed)
	type SubmitFunction<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
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
		cancel(): void;
		submitter: HTMLElement | null;
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
				result: ActionResult<Success, Invalid>;
				/**
				 * Call this to get the default behavior of a form submission response.
				 * @param options Set `reset: false` if you don't want the `<form>` values to be reset after a successful submission.
				 */
				update(options?: { reset: boolean }): Promise<void>;
		  }) => void)
	>;

	/**
	 * この action は `<form>` 要素を強化(enhances)します。JavaScriptが無効化されていても `<form>` 要素自体は動作します。
	 * @param form The form element
	 * @param options Callbacks for different states of the form lifecycle
	 */
	export function enhance<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	>(
		formElement: HTMLFormElement,
		/**
		 * Called upon submission with the given FormData and the `action` that should be triggered.
		 * If `cancel` is called, the form will not be submitted.
		 * You can use the abort `controller` to cancel the submission in case another one starts.
		 * If a function is returned, that function is called with the response from the server.
		 * If nothing is returned, the fallback will be used.
		 *
		 * If this function or its return value isn't set, it
		 * - falls back to updating the `form` prop with the returned data if the action is one same page as the form
		 * - updates `$page.status`
		 * - resets the `<form>` element and invalidates all data in case of successful submission with no redirect response
		 * - redirects in case of a redirect response
		 * - redirects to the nearest error page in case of an unexpected error
		 *
		 * If you provide a custom function with a callback and want to use the default behavior, invoke `update` in your callback.
		 */
		submit?: SubmitFunction<Success, Invalid>
	): { destroy(): void };

	/**
	 * この action は現在のページの `form` プロパティを与えられたデータで更新し、`$page.status` を更新します。
	 * エラーの場合、もっとも近くにあるエラーページにリダイレクトされます。
	 */
	export function applyAction<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	>(result: ActionResult<Success, Invalid>): Promise<void>;

	/**
	 * フォーム送信からのレスポンスをデシリアライズするためにこの関数を使用してください。
	 * 使用方法:
	 *
	 * ```js
	 * import { deserialize } from '$app/forms';
	 *
	 * async function handleSubmit(event) {
	 *   const response = await fetch('/form?/action', {
	 *     method: 'POST',
	 *     body: new FormData(event.target)
	 *   });
	 *
	 *   const result = deserialize(await response.text());
	 *   // ...
	 * }
	 * ```
	 */
	export function deserialize<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	>(serialized: string): ActionResult<Success, Invalid>;
}

declare module '$app/navigation' {
	import { BeforeNavigate, AfterNavigate } from '@sveltejs/kit';

	/**
	 * ナビゲーション後のページ更新の時にこれが(例えば `onMount`、`afterNavigate` の中や action で)呼び出された場合、SvelteKit の組み込みのスクロール処理を無効にします。
	 * ユーザーの期待する動きではなくなるため、一般的には推奨されません。
	 */
	export function disableScrollHandling(): void;
	/**
	 * SvelteKit が指定された `url` にナビゲーションしたときに解決する Promise を返します(ナビゲーションに失敗した場合は、Promise はリジェクトされます)。
	 * 外部の URL の場合は、`goto(url)` を呼び出す代わりに `window.location = url` を使用してください。
	 *
	 * @param url Where to navigate to. Note that if you've set [`config.kit.paths.base`](https://kit.svelte.jp/docs/configuration#paths) and the URL is root-relative, you need to prepend the base path if you want to navigate within the app.
	 * @param opts Options related to the navigation
	 */
	export function goto(
		url: string | URL,
		opts?: {
			/**
			 * If `true`, will replace the current `history` entry rather than creating a new one with `pushState`
			 */
			replaceState?: boolean;
			/**
			 * If `true`, the browser will maintain its scroll position rather than scrolling to the top of the page after navigation
			 */
			noScroll?: boolean;
			/**
			 * If `true`, the currently focused element will retain focus after navigation. Otherwise, focus will be reset to the body
			 */
			keepFocus?: boolean;
			/**
			 * The state of the new/updated history entry
			 */
			state?: any;
			/**
			 * If `true`, all `load` functions of the page will be rerun. See https://kit.svelte.jp/docs/load#rerunning-load-functions for more info on invalidation.
			 */
			invalidateAll?: boolean;
		}
	): Promise<void>;
	/**
	 * 現在アクティブなページに属している `load` 関数が `fetch` や `depends` を通じて当該の `url` に依存している場合は `load` 関数を再実行させます。ページが更新されたときに解決される `Promise` を返します。
	 *
	 * 引数が `string` または `URL` で与えられる場合、`fetch` や `depends` に渡されたものと同じ URL が解決できなければいけません (クエリパラメータも含みます)。
	 * カスタムの識別子を作るには、`[a-z]+:` から始まる文字列を使用してください (例: `custom:state`) — これは有効な URL です。
	 *
	 * `function` 引数はカスタムの predicate を定義するのに使用されます。フルの `URL` を受け取り、`true` が返された場合は `load` を再実行します。
	 * これは、完全一致ではなくパターンに基づいて invalidate をしたい場合に便利です。
	 *
	 * ```ts
	 * // Example: Match '/path' regardless of the query parameters
	 * import { invalidate } from '$app/navigation';
	 *
	 * invalidate((url) => url.pathname === '/path');
	 * ```
	 * @param url The invalidated URL
	 */
	export function invalidate(url: string | URL | ((url: URL) => boolean)): Promise<void>;
	/**
	 * 現在アクティブなページに属する全ての `load` 関数を再実行させます。ページが更新されたときに解決される `Promise` を返します。
	 */
	export function invalidateAll(): Promise<void>;
	/**
	 * 指定されたページをプログラム的にプリロードします、つまり
	 *  1. そのページのコードが取得され読み込まれていることを確認し、
	 *  2. そのページの load 関数を適切なオプションで呼び出します。
	 *
	 * `data-sveltekit-preload-data` が使用された `<a>` 要素をユーザーがタップまたはマウスオーバーしたときに SvelteKit がトリガーする動作と同じです。
	 * 次のナビゲーション先が `href` である場合、load から返される値が使われるので、ナビゲーションを瞬時に行うことができます。
	 * プリロードが完了したときに解決される Promise を返します。
	 *
	 * @param href Page to preload
	 */
	export function preloadData(href: string): Promise<void>;
	/**
	 * まだ取得されていないルート(routes)のコードをプログラム的にインポートします。
	 * 通常、後続のナビゲーションを高速にするためにこれを呼び出します。
	 *
	 * You can specify routes by any matching pathname such as `/about` (to match `src/routes/about/+page.svelte`) or `/blog/*` (to match `src/routes/blog/[slug]/+page.svelte`).
	 *
	 * `preloadData` とは異なり、この関数は `load` 関数を呼び出しません。
	 * モジュールのインポートが完了したときに解決される Promise を返します。
	 */
	export function preloadCode(...urls: string[]): Promise<void>;

	/**
	 * リンクをクリックしたり、`goto(...)` を呼び出したり、ブラウザの 戻る/進む を使うなどして新しい URL にナビゲーションするその直前にトリガーされるナビゲーションインターセプターです。
	 * `cancel()` を呼び出すと、ナビゲーションが完了するのを中止します。ナビゲーションが直接現在のページをアンロードした場合、`cancel` はネイティブブラウザの
	 * アンロード確認ダイアログが表示されます。この場合、`navigation.willUnload` が `true` になります。
	 *
	 * ナビゲーションがクライアントサイドではない場合、`navigation.to.route.id` は `null` になります。
	 *
	 * `beforeNavigate` はコンポーネントの初期化中に呼び出す必要があります。コンポーネントがマウントされている間、アクティブな状態を維持します。
	 */
	export function beforeNavigate(callback: (navigation: BeforeNavigate) => void): void;

	/**
	 * 現在のコンポーネントがマウントされるときや、新しい URL に移動するときに、与えられた `callback` を実行するライフサイクル関数です。
	 *
	 * `afterNavigate` はコンポーネントの初期化中に呼び出す必要があります。コンポーネントがマウントされている間、アクティブな状態を維持します。
	 */
	export function afterNavigate(callback: (navigation: AfterNavigate) => void): void;
}

declare module '$app/paths' {
	/**
	 * [`config.kit.paths.base`](https://kit.svelte.jp/docs/configuration#paths) にマッチする文字列です。
	 *
	 * 使い方の例: `<a href="{base}/your-page">Link</a>`
	 */
	export const base: `/${string}`;
	/**
	 * [`config.kit.paths.assets`](https://kit.svelte.jp/docs/configuration#paths) にマッチする絶対パス(absolute path)です。
	 *
	 * > `config.kit.paths.assets` に値が設定された場合でも、`vite dev` や `vite preview` のときは `'/_svelte_kit_assets'` で置き換えられます。なぜなら、アセットはまだその最終的な URL に存在しないからです。
	 */
	export const assets: `https://${string}` | `http://${string}`;
}

/**
 * サーバー上のストア(Store)は _コンテクスチュアル(contextual)_ で、ルート(root)コンポーネントの [context](https://svelte.jp/tutorial/context-api) に追加されます。つまり、`page` はリクエストごとにユニークであり、同じサーバーで同時に処理される複数のリクエスト感で共有されません。
 *
 * そのため、ストアを使用するためには、コンポーネントの初期化の際にそのストアをサブスクライブする必要があります (コンポーネント内で `$page` という形でストアの値を参照する場合、自動的にそうなります)。
 *
 * ブラウザでは、これを心配する必要はありません。ストアはどこからでもアクセスできます。ブラウザ上でのみ実行されるコードは、いつでもこれらのストアを参照 (またはサブスクライブ) することができます。
 *
 * クライアント/サーバーの違いについては、ドキュメントの [state management](https://kit.svelte.jp/docs/state-management#using-stores-with-context) をお読みください。
 */
declare module '$app/stores' {
	import { Readable } from 'svelte/store';
	import { Navigation, Page } from '@sveltejs/kit';

	/**
	 * ページのデータの値を含む読み取り可能なストア(readable store)です。
	 *
	 * サーバー上では、この store はコンポーネントの初期化時にのみサブスクライブ(subscribe)できます。ブラウザでは、いつでもサブスクライブ(subscribe)できます。
	 */
	export const page: Readable<Page>;
	/**
	 * 読み取り可能なストア(readable store)です。
	 * ナビゲーションが開始すると、その値は `from`、`to`、`type`、(もし `type === 'popstate'` の場合) `delta` プロパティを持つ `Navigation` オブジェクトです。
	 * ナビゲーションが終了すると、その値は `null` に戻ります。
	 *
	 * サーバー上では、この store はコンポーネントの初期化時にのみサブスクライブ(subscribe)できます。ブラウザでは、いつでもサブスクライブ(subscribe)できます。
	 */
	export const navigating: Readable<Navigation | null>;
	/**
	 * 読み取り可能なストア(readable store)で、初期値は `false` です。[`version.pollInterval`](https://kit.svelte.jp/docs/configuration#version) が 0 以外の値である場合、SvelteKit はアプリの新しいバージョンをポーリングし、それを検知するとこのストアの値を `true` に更新します。`updated.check()` は、ポーリングに関係なくすぐにチェックするよう強制します。
	 *
	 * サーバー上では、この store はコンポーネントの初期化時にのみサブスクライブ(subscribe)できます。ブラウザでは、いつでもサブスクライブ(subscribe)できます。
	 */
	export const updated: Readable<boolean> & { check(): Promise<boolean> };

	/**
	 * 全てのコンテクスチュアルなストア(contextual stores)を返す関数です。サーバー上では、コンポーネントの初期化時に呼び出す必要があります。
	 * 何らかの理由で、コンポーネントのマウント後までストアのサブスクライブを遅延させたい場合にのみ、これを使用してください。
	 */
	export function getStores(): {
		navigating: typeof navigating;
		page: typeof page;
		updated: typeof updated;
	};
}

/**
 * このモジュールは [service workers](https://kit.svelte.jp/docs/service-workers) でのみ使用できます。
 */
declare module '$service-worker' {
	/**
	 * デプロイメントの `base` パスです。通常は、これは `config.kit.paths.base` と同じですが、`location.pathname` から計算されるので、サイトがサブディレクトリにデプロイされても正しく動作し続けます。
	 * `base` はありますが、`assets` がないことにご注意ください。`config.kit.paths.assets` が指定されている場合に service worker を使用することができないためです。
	 */
	export const base: string;
	/**
	 * Viteが生成するファイルを表すURL文字列の配列で、`cache.addAll(build)` を使ってキャッシュするのに適しています。
	 * 開発中は、これは空の配列となります。
	 */
	export const build: string[];
	/**
	 * 静的なディレクトリまたは `config.kit.files.assets` で指定されたディレクトリにあるファイルを表す URL 文字列の配列です。どのファイルを `static` ディレクトリに含めるかについては、[`config.kit.serviceWorker.files`](https://kit.svelte.jp/docs/configuration) でカスタマイズできます。
	 */
	export const files: string[];
	/**
	 * プリレンダリングされたページとエンドポイントに合致するパス名の配列です。
	 * 開発中は、これは空の配列となります。
	 */
	export const prerendered: string[];
	/**
	 * [`config.kit.version`](https://kit.svelte.jp/docs/configuration#version) をご参照ください。これは、Service Worker 内で一意なキャッシュ名を生成するのに便利で、後でアプリをデプロイしたときに古いキャッシュを無効にすることができます。
	 */
	export const version: string;
}

declare module '@sveltejs/kit/hooks' {
	import { Handle } from '@sveltejs/kit';

	/**
	 * 複数の `handle` の呼び出しを middleware ライクな方法でシーケンス化するヘルパー関数です。
	 * `handle` オプションの動作は以下の通り:
	 * - `transformPageChunk` は、逆順に適用され、マージされます
	 * - `preload` は順に適用され、最初のオプションが "勝ち" となり、それ以降の `preload` オプションは呼ばれません
	 * - `filterSerializedResponseHeaders` は `preload` と同じように動作します
	 *
	 * ```js
	 * /// file: src/hooks.server.js
	 * import { sequence } from '@sveltejs/kit/hooks';
	 *
	 * /// type: import('@sveltejs/kit').Handle
	 * async function first({ event, resolve }) {
	 * 	console.log('first pre-processing');
	 * 	const result = await resolve(event, {
	 * 		transformPageChunk: ({ html }) => {
	 * 			// transforms are applied in reverse order
	 * 			console.log('first transform');
	 * 			return html;
	 * 		},
	 * 		preload: () => {
	 * 			// this one wins as it's the first defined in the chain
	 * 			console.log('first preload');
	 * 		}
	 * 	});
	 * 	console.log('first post-processing');
	 * 	return result;
	 * }
	 *
	 * /// type: import('@sveltejs/kit').Handle
	 * async function second({ event, resolve }) {
	 * 	console.log('second pre-processing');
	 * 	const result = await resolve(event, {
	 * 		transformPageChunk: ({ html }) => {
	 * 			console.log('second transform');
	 * 			return html;
	 * 		},
	 * 		preload: () => {
	 * 			console.log('second preload');
	 * 		},
	 * 		filterSerializedResponseHeaders: () => {
	 * 			// this one wins as it's the first defined in the chain
	 *    		console.log('second filterSerializedResponseHeaders');
	 * 		}
	 * 	});
	 * 	console.log('second post-processing');
	 * 	return result;
	 * }
	 *
	 * export const handle = sequence(first, second);
	 * ```
	 *
	 * 上記の例はこのようにプリントされます:
	 *
	 * ```
	 * first pre-processing
	 * first preload
	 * second pre-processing
	 * second filterSerializedResponseHeaders
	 * second transform
	 * first transform
	 * second post-processing
	 * first post-processing
	 * ```
	 *
	 * @param handlers The chain of `handle` functions
	 */
	export function sequence(...handlers: Handle[]): Handle;
}

/**
 * `fetch` やそれに関連する interface の polyfill で、ネイティブ実装が提供されない環境向けの adapter が使用します。
 */
declare module '@sveltejs/kit/node/polyfills' {
	/**
	 * 様々な web API をグローバルで使用できるようにします:
	 * - `crypto`
	 * - `fetch`
	 * - `Headers`
	 * - `Request`
	 * - `Response`
	 */
	export function installPolyfills(): void;
}

/**
 * Node ライクな環境向けの adapter で使用されるユーティリティーです。
 */
declare module '@sveltejs/kit/node' {
	export function getRequest(opts: {
		base: string;
		request: import('http').IncomingMessage;
		bodySizeLimit?: number;
	}): Promise<Request>;
	export function setResponse(res: import('http').ServerResponse, response: Response): void;
}

declare module '@sveltejs/kit/vite' {
	import { Plugin } from 'vite';

	/**
	 * SvelteKit Vite プラグインを返します。
	 */
	export function sveltekit(): Promise<Plugin[]>;
	export { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
}
