/**
 * `App` namespace を宣言することで、アプリ内のオブジェクトを型付けする方法を SvelteKit に伝えることが可能です。デフォルトでは、新しいプロジェクトには `src/app.d.ts` というファイルがあり、以下の内容を含んでいます:
 *
 * ```ts
 * /// <reference types="@sveltejs/kit" />
 *
 * declare namespace App {
 * 	interface Locals {}
 *
 * 	interface Platform {}
 *
 * 	interface PrivateEnv {}
 *
 * 	interface PublicEnv {}
 *
 * 	interface Session {}
 *
 * 	interface Stuff {}
 * }
 * ```
 *
 * By populating these interfaces, you will gain type safety when using `env`, `event.locals`, `event.platform`, `session` and `stuff`.
 *
 * Note that since it's an ambient declaration file, you have to be careful when using `import` statements. Once you add an `import`
 * at the top level, the declaration file is no longer considered ambient and you lose access to these typings in other files.
 * To avoid this, either use the `import(...)` function:
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
	 * The interface that defines `event.locals`, which can be accessed in [hooks](https://kit.svelte.dev/docs/hooks) (`handle`, `handleError` and `getSession`) and [endpoints](https://kit.svelte.dev/docs/routing#endpoints).
	 */
	export interface Locals {}

	/**
	 * If your adapter provides [platform-specific context](https://kit.svelte.dev/docs/adapters#supported-environments-platform-specific-context) via `event.platform`, you can specify it here.
	 */
	export interface Platform {}

	/**
	 * The interface that defines the dynamic environment variables exported from '$env/dynamic/private'.
	 */
	export interface PrivateEnv extends Record<string, string> {}

	/**
	 * The interface that defines the dynamic environment variables exported from '$env/dynamic/public'.
	 */
	export interface PublicEnv extends Record<string, string> {}

	/**
	 * The interface that defines `session`, both as an argument to [`load`](https://kit.svelte.dev/docs/loading) functions and the value of the [session store](https://kit.svelte.dev/docs/modules#$app-stores).
	 */
	export interface Session {}

	/**
	 * The interface that defines `stuff`, as input or output to [`load`](https://kit.svelte.dev/docs/loading) or as the value of the `stuff` property of the [page store](https://kit.svelte.dev/docs/modules#$app-stores).
	 */
	export interface Stuff {}
}

/**
 * ```ts
 * import { browser, dev, prerendering } from '$app/env';
 * ```
 */
declare module '$app/env' {
	/**
	 * `true` if the app is running in the browser.
	 */
	export const browser: boolean;

	/**
	 * Whether the dev server is running. This is not guaranteed to correspond to `NODE_ENV` or `MODE`.
	 */
	export const dev: boolean;

	/**
	 * プリレンダリング時は `true`、それ以外の場合は `false` です。
	 */
	export const prerendering: boolean;
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example
 * if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running
 * [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes
 * variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#kit-env-publicprefix).
 *
 * This module cannot be imported into client-side code.
 *
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/private' {
	export let env: App.PrivateEnv;
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes
 * variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#kit-env-publicprefix)
 * (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code
 *
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 *
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export let env: App.PublicEnv;
}

/**
 * ```ts
 * import {
 * 	afterNavigate,
 * 	beforeNavigate,
 * 	disableScrollHandling,
 * 	goto,
 * 	invalidate,
 * 	prefetch,
 * 	prefetchRoutes
 * } from '$app/navigation';
 * ```
 */
declare module '$app/navigation' {
	/**
	 * ナビゲーション後のページ更新の時にこれが(例えば `onMount`、`afterNavigate` の中や action で)呼び出された場合、SvelteKit の組み込みのスクロール処理を無効にします。
	 * ユーザーの期待する動きではなくなるため、一般的には推奨されません。
	 */
	export function disableScrollHandling(): void;
	/**
	 * Returns a Promise that resolves when SvelteKit navigates (or fails to navigate, in which case the promise rejects) to the specified `url`.
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
	 * 現在アクティブなページに属している `load` 関数が当該リソースを `fetch` する場合や、invalidate されたリソースがページそのものだったときにページエンドポイントからデータを再フェッチする場合に再実行させます。それに続いてページが更新されたときに解決される `Promise` を返します。
	 * @param dependency The invalidated resource
	 */
	export function invalidate(dependency: string | ((href: string) => boolean)): Promise<void>;
	/**
	 * 指定されたページをプログラム的にプリフェッチします、つまり
	 *  1. そのページのコードが取得され読み込まれていることを確認し、
	 *  2. そのページの load 関数を適切なオプションで呼び出します。
	 *
	 * `sveltekit:prefetch` が使用された `<a>` 要素をユーザーがタップまたはマウスオーバーしたときに SvelteKit がトリガーする動作と同じです。
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
	 * リンクをクリックしたり、`goto` を呼び出したり、ブラウザの 戻る/進む を使うなどして新しい URL (内部と外部どちらも含む) にナビゲーションするその直前にトリガーされるナビゲーションインターセプターです。
	 * 条件付きでナビゲーションを完了させないようにしたり、次の URL を調べたい場合に便利です。
	 */
	export function beforeNavigate(
		fn: (navigation: { from: URL; to: URL | null; cancel: () => void }) => void
	): void;

	/**
	 * ページがマウントされたときや、ページコンポーネントがそのままでも Sveltekit がナビゲーションしたときに実行されるライフサイクル関数です。
	 */
	export function afterNavigate(fn: (navigation: { from: URL | null; to: URL }) => void): void;
}

/**
 * ```ts
 * import { base, assets } from '$app/paths';
 * ```
 */
declare module '$app/paths' {
	/**
	 * A string that matches [`config.kit.paths.base`](https://kit.svelte.dev/docs/configuration#paths). It must start, but not end with `/` (e.g. `/base-path`), unless it is the empty string.
	 */
	export const base: `/${string}`;
	/**
	 * An absolute path that matches [`config.kit.paths.assets`](https://kit.svelte.dev/docs/configuration#paths).
	 *
	 * > If a value for `config.kit.paths.assets` is specified, it will be replaced with `'/_svelte_kit_assets'` during `vite dev` or `vite preview`, since the assets don't yet live at their eventual URL.
	 */
	export const assets: `https://${string}` | `http://${string}`;
}

/**
 * ```ts
 * import { getStores, navigating, page, session, updated } from '$app/stores';
 * ```
 *
 * ストア(Store)は _コンテクスチュアル(contextual)_ で、ルート(root)コンポーネントの [context](https://svelte.jp/tutorial/context-api) に追加されます。つまり、`session` と `page` はサーバー上の各リクエストごとにユニークであり、同じサーバー上で同時に処理される複数のリクエスト間で共有されません。これにより、`session` にユーザー固有のデータを含めても安全になります。
 *
 * そのため、ストアを使用するにはコンポーネントの初期化の際にそのストアをサブスクライブする必要があります (コンポーネント内で `$page` というような形でストアの値を参照する場合、自動的にそうなります)。
 */
declare module '$app/stores' {
	import { Readable, Writable } from 'svelte/store';
	import { Navigation, Page } from '@sveltejs/kit';

	/**
	 * `getContext` をラップしている便利な関数です。コンポーネントの初期化時に呼び出す必要があります。
	 * 何らかの理由で、コンポーネントのマウント後までストアのサブスクライブを遅延させたい場合にのみ、これを使用してください。
	 */
	export function getStores(): {
		navigating: typeof navigating;
		page: typeof page;
		session: typeof session;
		updated: typeof updated;
	};

	/**
	 * ページ(page) のデータを値として持つ読み取り可能なストアです。
	 */
	export const page: Readable<Page>;
	/**
	 * 読み取り可能なストアです。
	 * ナビゲーションを開始すると、その値は `{ from: URL, to: URL }` となります。
	 * ナビゲーションが終了すると、その値は `null` に戻ります。
	 */
	export const navigating: Readable<Navigation | null>;
	/**
	 * A writable store whose initial value is whatever was returned from [`getSession`](https://kit.svelte.dev/docs/hooks#getsession).
	 * It can be written to, but this will not cause changes to persist on the server — this is something you must implement yourself.
	 */
	export const session: Writable<App.Session>;
	/**
	 *  A readable store whose initial value is `false`. If [`version.pollInterval`](https://kit.svelte.dev/docs/configuration#version) is a non-zero value, SvelteKit will poll for new versions of the app and update the store value to `true` when it detects one. `updated.check()` will force an immediate check, regardless of polling.
	 */
	export const updated: Readable<boolean> & { check: () => boolean };
}

/**
 * ```ts
 * import { build, files, prerendered, version } from '$service-worker';
 * ```
 *
 * This module is only available to [service workers](https://kit.svelte.dev/docs/service-workers).
 */
declare module '$service-worker' {
	/**
	 * Viteが生成するファイルを表すURL文字列の配列で、`cache.addAll(build)` を使ってキャッシュするのに適しています。
	 */
	export const build: string[];
	/**
	 * An array of URL strings representing the files in your static directory, or whatever directory is specified by `config.kit.files.assets`. You can customize which files are included from `static` directory using [`config.kit.serviceWorker.files`](https://kit.svelte.dev/docs/configuration)
	 */
	export const files: string[];
	/**
	 * プリレンダリングされたページとエンドポイントに合致するパス名の配列です。
	 */
	export const prerendered: string[];
	/**
	 * See [`config.kit.version`](https://kit.svelte.dev/docs/configuration#version). It's useful for generating unique cache names inside your service worker, so that a later deployment of your app can invalidate old caches.
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
	 * 	const result = await resolve(event);
	 * 	console.log('first post-processing');
	 * 	return result;
	 * }
	 *
	 * /** @type {import('@sveltejs/kit').Handle} *\/
	 * async function second({ event, resolve }) {
	 * 	console.log('second pre-processing');
	 * 	const result = await resolve(event);
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
	 * Returns the SvelteKit Vite plugins.
	 */
	export function sveltekit(): Plugin[];
}
