/**
 * `App` namespace を宣言することで、アプリ内のオブジェクトを型付けする方法を SvelteKit に伝えることが可能です。デフォルトでは、新しいプロジェクトには `src/app.d.ts` というファイルがあり、以下の内容を含んでいます:
 *
 * ```ts
 * /// <reference types="@sveltejs/kit" />
 *
 * declare namespace App {
 * 	interface Locals {}
 *
 * 	interface PageData {}
 *
 * 	interface Platform {}
 * }
 * ```
 *
 * これらのインターフェースを作成することによって、`event.locals`、`event.platform`、`load` 関数の `data` を使用する際に型の安全性を確保することができます。
 *
 * アンビエント宣言(ambient declaration)ファイルであるため、`import` 文を使用するときには注意が必要です。`import` を
 * トップレベルに追加すると、宣言ファイル (declaration file) はアンビエント (ambient) とはみなされなくなるため、他のファイルでこれらの型付けにアクセスできなくなります。
 * これを避けるには、`import(...)` 関数をお使いください:
 *
 * ```ts
 * interface Locals {
 * 	user: import('$lib/types').User;
 * }
 * ```
 * Or wrap the namespace with `declare global`:
 * ```ts
 * import { User } from '$lib/types';
 *
 * declare global {
 * 	namespace App {
 * 		interface Locals {
 * 			user: User;
 * 		}
 * 		// ...
 * 	}
 * }
 * ```
 *
 */
declare namespace App {
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
	 * adapter が `event.platform` で [プラットフォーム固有の情報](https://kit.svelte.jp/docs/adapters#supported-environments-platform-specific-context) を提供する場合、ここでそれを指定することができます。
	 */
	export interface Platform {}

	/**
	 * Defines the common shape of expected and unexpected errors. Expected errors are thrown using the `error` function. Unexpected errors are handled by the `handleError` hooks which should return this shape.
	 */
	export interface PageError {
		message: string;
	}
}

/**
 * ```ts
 * import { browser, dev, prerendering } from '$app/environment';
 * ```
 */
declare module '$app/environment' {
	/**
	 * アプリがブラウザで動作している場合 `true` です。
	 */
	export const browser: boolean;

	/**
	 * 開発サーバーが動作しているかどうか。`NODE_ENV` や `MODE` に対応しているか保証されません。
	 */
	export const dev: boolean;

	/**
	 * プリレンダリング時は `true`、それ以外の場合は `false` です。
	 */
	export const prerendering: boolean;
}

/**
 * ```ts
 * import { enhance, applyAction } from '$app/forms';
 * ```
 */
declare module '$app/forms' {
	import type { ActionResult } from '@sveltejs/kit';

	export type SubmitFunction<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	> = (input: {
		action: string;
		data: FormData;
		form: HTMLFormElement;
		controller: AbortController;
		cancel: () => void;
	}) =>
		| void
		| ((opts: {
				form: HTMLFormElement;
				action: string;
				result: ActionResult<Success, Invalid>;
		  }) => void);

	/**
	 * This action enhances a `<form>` element that otherwise would work without JavaScript.
	 * @param form The form element
	 * @param options Callbacks for different states of the form lifecycle
	 */
	export function enhance<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	>(
		form: HTMLFormElement,
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
		 * - invalidates all data in case of successful submission with no redirect response
		 * - redirects in case of a redirect response
		 * - redirects to the nearest error page in case of an unexpected error
		 */
		submit?: SubmitFunction<Success, Invalid>
	): { destroy: () => void };

	/**
	 * This action updates the `form` property of the current page with the given data and updates `$page.status`.
	 * In case of an error, it redirects to the nearest error page.
	 */
	export function applyAction<
		Success extends Record<string, unknown> | undefined = Record<string, any>,
		Invalid extends Record<string, unknown> | undefined = Record<string, any>
	>(result: ActionResult<Success, Invalid>): Promise<void>;
}

/**
 * ```ts
 * import {
 * 	afterNavigate,
 * 	beforeNavigate,
 * 	disableScrollHandling,
 * 	goto,
 * 	invalidate,
 * 	invalidateAll,
 * 	prefetch,
 * 	prefetchRoutes
 * } from '$app/navigation';
 * ```
 */
declare module '$app/navigation' {
	import { Navigation } from '@sveltejs/kit';

	/**
	 * ナビゲーション後のページ更新の時にこれが(例えば `onMount`、`afterNavigate` の中や action で)呼び出された場合、SvelteKit の組み込みのスクロール処理を無効にします。
	 * ユーザーの期待する動きではなくなるため、一般的には推奨されません。
	 */
	export function disableScrollHandling(): void;
	/**
	 * SvelteKit が指定された `url` にナビゲーションしたときに解決する Promise を返します(ナビゲーションに失敗した場合は、Promise はリジェクトされます)。
	 *
	 * @param url Where to navigate to
	 * @param opts.replaceState If `true`, will replace the current `history` entry rather than creating a new one with `pushState`
	 * @param opts.noscroll If `true`, the browser will maintain its scroll position rather than scrolling to the top of the page after navigation
	 * @param opts.keepfocus If `true`, the currently focused element will retain focus after navigation. Otherwise, focus will be reset to the body
	 * @param opts.state The state of the new/updated history entry
	 */
	export function goto(
		url: string | URL,
		opts?: { replaceState?: boolean; noscroll?: boolean; keepfocus?: boolean; state?: any }
	): Promise<void>;
	/**
	 * 現在アクティブなページに属している `load` 関数が `fetch` や `depends` を通じて当該の `url` に依存している場合は `load` 関数を再実行させます。ページが更新されたときに解決される `Promise` を返します。
	 *
	 * If the argument is given as a `string` or `URL`, it must resolve to the same URL that was passed to `fetch` or `depends` (including query parameters).
	 * To create a custom identifier, use a string beginning with `[a-z]+:` (e.g. `custom:state`) — this is a valid URL.
	 *
	 * The `function` argument can be used define a custom predicate. It receives the full `URL` and causes `load` to rerun if `true` is returned.
	 * This can be useful if you want to invalidate based on a pattern instead of a exact match.
	 *
	 * ```ts
	 * // Example: Match '/path' regardless of the query parameters
	 * invalidate((url) => url.pathname === '/path');
	 * ```
	 * @param url The invalidated URL
	 */
	export function invalidate(url: string | URL | ((url: URL) => boolean)): Promise<void>;
	/**
	 * Causes all `load` functions belonging to the currently active page to re-run. Returns a `Promise` that resolves when the page is subsequently updated.
	 */
	export function invalidateAll(): Promise<void>;
	/**
	 * 指定されたページをプログラム的にプリフェッチします、つまり
	 *  1. そのページのコードが取得され読み込まれていることを確認し、
	 *  2. そのページの load 関数を適切なオプションで呼び出します。
	 *
	 * `data-sveltekit-prefetch` が使用された `<a>` 要素をユーザーがタップまたはマウスオーバーしたときに SvelteKit がトリガーする動作と同じです。
	 * 次のナビゲーション先が `href` である場合、load から返される値が使われるので、ナビゲーションを瞬時に行うことができます。
	 * プリフェッチが完了したときに解決される Promise を返します。
	 *
	 * @param href Page to prefetch
	 */
	export function prefetch(href: string): Promise<void>;
	/**
	 * まだ取得されていないルート(routes)のコードをプログラム的にプリフェッチします。
	 * 通常、後続のナビゲーションを高速にするためにこれを呼び出します。
	 *
	 * 引数を指定しない場合は全てのルート(routes)を取得します。指定する場合は、ルート(routes)にマッチするパス名、例えば
	 * `/about` (`src/routes/about.svelte` にマッチ) や `/blog/*` (`src/routes/blog/[slug].svelte` にマッチ) のように指定することができます。
	 *
	 * prefetch 関数とは異なり、この関数はそれぞれのページの load を呼び出しません。
	 * ルート(routes)のプリフェッチが完了したときに解決される Promise を返します。
	 */
	export function prefetchRoutes(routes?: string[]): Promise<void>;

	/**
	 * リンクをクリックしたり、`goto(...)` を呼び出したり、ブラウザの 戻る/進む を使うなどして新しい URL にナビゲーションするその直前にトリガーされるナビゲーションインターセプターです。
	 * Calling `cancel()` will prevent the navigation from completing.
	 *
	 * When navigating to an external URL, `navigation.to` will be `null`.
	 *
	 * `beforeNavigate` must be called during a component initialization. It remains active as long as the component is mounted.
	 */
	export function beforeNavigate(
		callback: (navigation: Navigation & { cancel: () => void }) => void
	): void;

	/**
	 * A lifecycle function that runs the supplied `callback` when the current component mounts, and also whenever we navigate to a new URL.
	 *
	 * `afterNavigate` must be called during a component initialization. It remains active as long as the component is mounted.
	 */
	export function afterNavigate(callback: (navigation: Navigation) => void): void;
}

/**
 * ```ts
 * import { base, assets } from '$app/paths';
 * ```
 */
declare module '$app/paths' {
	/**
	 * [`config.kit.paths.base`](https://kit.svelte.jp/docs/configuration#paths) にマッチする文字列です。先頭は `/` で始まる必要があり、末尾を `/` にしてはいけません (例: `/base-path`)。空文字(empty string)の場合はこのルールに該当しません。
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
 * ```ts
 * import { getStores, navigating, page, updated } from '$app/stores';
 * ```
 *
 * サーバー上のストア(Store)は _コンテクスチュアル(contextual)_ で、ルート(root)コンポーネントの [context](https://svelte.jp/tutorial/context-api) に追加されます。つまり、`page` はリクエストごとにユニークであり、同じサーバーで同時に処理される複数のリクエスト感で共有されません。
 *
 * そのため、ストアを使用するためには、コンポーネントの初期化の際にそのストアをサブスクライブする必要があります (コンポーネント内で `$page` という形でストアの値を参照する場合、自動的にそうなります)。
 *
 * ブラウザでは、これを心配する必要はありません。ストアはどこからでもアクセスできます。ブラウザ上でのみ実行されるコードは、いつでもこれらのストアを参照 (またはサブスクライブ) することができます。
 */
declare module '$app/stores' {
	import { Readable } from 'svelte/store';
	import { Navigation, Page } from '@sveltejs/kit';

	/**
	 * ページのデータの値を含む読み取り可能なストア(readable store)です。
	 */
	export const page: Readable<Page>;
	/**
	 * 読み取り可能なストア(readable store)です。
	 * When navigating starts, its value is a `Navigation` object with `from`, `to`, `type` and (if `type === 'popstate'`) `delta` properties.
	 * ナビゲーションが終了すると、その値は `null` に戻ります。
	 */
	export const navigating: Readable<Navigation | null>;
	/**
	 * 読み取り可能なストア(readable store)で、初期値は `false` です。[`version.pollInterval`](https://kit.svelte.jp/docs/configuration#version) が 0 以外の値である場合、SvelteKit はアプリの新しいバージョンをポーリングし、それを検知するとこのストアの値を `true` に更新します。`updated.check()` は、ポーリングに関係なくすぐにチェックするよう強制します。
	 */
	export const updated: Readable<boolean> & { check: () => boolean };

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
 * ```ts
 * import { build, files, prerendered, version } from '$service-worker';
 * ```
 *
 * このモジュールは [service workers](https://kit.svelte.jp/docs/service-workers) でのみ使用できます。
 */
declare module '$service-worker' {
	/**
	 * Viteが生成するファイルを表すURL文字列の配列で、`cache.addAll(build)` を使ってキャッシュするのに適しています。
	 */
	export const build: string[];
	/**
	 * 静的なディレクトリまたは `config.kit.files.assets` で指定されたディレクトリにあるファイルを表す URL 文字列の配列です。どのファイルを `static` ディレクトリに含めるかについては、[`config.kit.serviceWorker.files`](https://kit.svelte.jp/docs/configuration) でカスタマイズできます。
	 */
	export const files: string[];
	/**
	 * プリレンダリングされたページとエンドポイントに合致するパス名の配列です。
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
	 *
	 * ```js
	 * /// file: src/hooks.js
	 * import { sequence } from '@sveltejs/kit/hooks';
	 *
	 * /** @type {import('@sveltejs/kit').Handle} *\/
	 * async function first({ event, resolve }) {
	 * 	console.log('first pre-processing');
	 * 	const result = await resolve(event, {
	 * 		transformPageChunk: ({ html }) => {
	 * 			// transforms are applied in reverse order
	 * 			console.log('first transform');
	 * 			return html;
	 * 		}
	 * 	});
	 * 	console.log('first post-processing');
	 * 	return result;
	 * }
	 *
	 * /** @type {import('@sveltejs/kit').Handle} *\/
	 * async function second({ event, resolve }) {
	 * 	console.log('second pre-processing');
	 * 	const result = await resolve(event, {
	 * 		transformPageChunk: ({ html }) => {
	 * 			console.log('second transform');
	 * 			return html;
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
	 * second pre-processing
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
	export function getRequest(
		base: string,
		request: import('http').IncomingMessage
	): Promise<Request>;
	export function setResponse(res: import('http').ServerResponse, response: Response): void;
}

declare module '@sveltejs/kit/vite' {
	import { Plugin } from 'vite';

	/**
	 * SvelteKit Vite プラグインを返します。
	 */
	export function sveltekit(): Plugin[];
}
