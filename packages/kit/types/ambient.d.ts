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
 * }
 * ```
 *
 * これらのインターフェースを作成することによって、`env`、`event.locals`、`event.platform` を使用する際に型の安全性を確保することができます。
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
	 * adapter が `event.platform` で [プラットフォーム固有の情報](https://kit.svelte.jp/docs/adapters#supported-environments-platform-specific-context) を提供する場合、ここでそれを指定することができます。
	 */
	export interface Platform {}

	/**
	 * `$env/dynamic/private` からエクスポートされる動的な環境変数を定義する interface です。
	 */
	export interface PrivateEnv extends Record<string, string> {}

	/**
	 * `$env/dynamic/public` からエクスポートされる動的な環境変数を定義する interface です。
	 */
	export interface PublicEnv extends Record<string, string> {}
}

/**
 * ```ts
 * import { browser, dev, prerendering } from '$app/env';
 * ```
 */
declare module '$app/env' {
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
 * このモジュールは、実行中のプラットフォームで定義された、実行時の環境変数へのアクセスを提供します。例えば、
 * [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) を使用している場合 (または
 * [`vite preview`](https://kit.svelte.jp/docs/cli) の実行中の場合)、これは `process.env` と同じです。このモジュールは
 * [`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#kit-env-publicprefix) で始まらない変数のみを含んでいます。
 *
 * このモジュールはクライアントサイドのコードにインポートできません。
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
 * [`$env/dynamic/private`](https://kit.svelte.jp/docs/modules#$env-dynamic-private) と似ていますが、
 * [`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#kit-env-publicprefix) で始まる変数のみを含んでいるため
 * (デフォルトは `PUBLIC_`)、クライアントサイドのコードに安全に公開することができます。
 *
 * パブリックで動的な環境変数は全てサーバーからクライアントに送られるため、より大きなネットワークリクエストを引き起こすことにご注意ください。可能であれば、代わりに `$env/static/public` をお使いください。
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
	 * 現在アクティブなページに属している `load` 関数が当該リソースを `fetch` する場合や、invalidate されたリソースがページそのものだったときにページエンドポイントからデータを再フェッチする場合に再実行させます。If no argument is given, all resources will be invalidated. それに続いてページが更新されたときに解決される `Promise` を返します。
	 * @param dependency The invalidated resource
	 */
	export function invalidate(dependency?: string | ((href: string) => boolean)): Promise<void>;
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
	 * [`config.kit.paths.base`](https://kit.svelte.jp/docs/configuration#paths) にマッチする文字列です。先頭は `/` で始まる必要があり、末尾を `/` にしてはいかません (例: `/base-path`)。空文字(empty string)の場合はこのルールに該当しません。
	 */
	export const base: `/${string}`;
	/**
	 * [`config.kit.paths.assets`](https://kit.svelte.jp/docs/configuration#paths) にマッチする絶対パス(absolute path)です。
	 *
	 * > If a value for `config.kit.paths.assets` is specified, it will be replaced with `'/_svelte_kit_assets'` during `vite dev` or `vite preview`, since the assets don't yet live at their eventual URL.
	 * > `config.kit.paths.assets` に値が設定された場合でも、`vite dev` や `vite preview` のときは `'/_svelte_kit_assets'` で置き換えられます。なぜなら、アセットはまだその最終的な URL に存在しないからです。
	 */
	export const assets: `https://${string}` | `http://${string}`;
}

/**
 * ```ts
 * import { getStores, navigating, page, updated } from '$app/stores';
 * ```
 *
 * Stores on the server are _contextual_ — they are added to the [context](https://svelte.dev/tutorial/context-api) of your root component. This means that `page` is unique to each request, rather than shared between multiple requests handled by the same server simultaneously.
 *
 * Because of that, you must subscribe to the stores during component initialization (which happens automatically if you reference the store value, e.g. as `$page`, in a component) before you can use them.
 *
 * In the browser, we don't need to worry about this, and stores can be accessed from anywhere. Code that will only ever run on the browser can refer to (or subscribe to) any of these stores at any time.
 */
declare module '$app/stores' {
	import { Readable } from 'svelte/store';
	import { Navigation, Page } from '@sveltejs/kit';

	/**
	 * A readable store whose value contains page data.
	 */
	export const page: Readable<Page>;
	/**
	 * 読み取り可能なストアです。
	 * ナビゲーションを開始すると、その値は `{ from: URL, to: URL }` となります。
	 * ナビゲーションが終了すると、その値は `null` に戻ります。
	 */
	export const navigating: Readable<Navigation | null>;
	/**
	 *  A readable store whose initial value is `false`. If [`version.pollInterval`](https://kit.svelte.dev/docs/configuration#version) is a non-zero value, SvelteKit will poll for new versions of the app and update the store value to `true` when it detects one. `updated.check()` will force an immediate check, regardless of polling.
	 */
	export const updated: Readable<boolean> & { check: () => boolean };

	/**
	 * A function that returns all of the contextual stores. On the server, this must be called during component initialization.
	 * Only use this if you need to defer store subscription until after the component has mounted, for some reason.
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
	 * SvelteKit Vite プラグインを返します。
	 */
	export function sveltekit(): Plugin[];
}
