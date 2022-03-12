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
 * 	interface Session {}
 *
 * 	interface Stuff {}
 * }
 * ```
 *
 * これらの interface を活用することで、`event.locals`、`event.platform`、`session`、`stuff` を使用する際に型の安全性を得ることができます:
 */
declare namespace App {
	/**
	 * `event.locals` を定義する interface です。`event.locals` は [hooks](/docs/hooks) (`handle`、`handleError`、`getSession`) と [エンドポイント(endpoints)](/docs/routing#endpoints) からアクセスできます。
	 */
	export interface Locals {}

	/**
	 * adapter が `event.platform` で [プラットフォーム固有の情報](/docs/adapters#supported-environments-platform-specific-context) を提供する場合、ここでそれを指定することができます。
	 */
	export interface Platform {}

	/**
	 * `session` を定義する interfaceです。`session` は、[`load`](/docs/loading) 関数の引数であり、[session store](/docs/modules#$app-stores) の値でもあります。
	 */
	export interface Session {}

	/**
	 * `stuff` を定義する interface です。`stuff` は [`load`](/docs/loading) 関数の input/output であり、[page store](/docs/modules#$app-stores) の `stuff` プロパティの値でもあります。
	 */
	export interface Stuff {}
}

/**
 * ```ts
 * import { amp, browser, dev, mode, prerendering } from '$app/env';
 * ```
 */
declare module '$app/env' {
	/**
	 * アプリが [AMP モード](/docs/seo#manual-setup-amp) で動作しているかどうかを示します。
	 */
	export const amp: boolean;
	/**
	 * アプリがブラウザで動作しているか、それともサーバーで動作しているかを示します。
	 */
	export const browser: boolean;
	/**
	 * 開発モードの場合は `true`、本番環境の場合は `false` です。
	 */
	export const dev: boolean;
	/**
	 * プリレンダリング時は `true`、それ以外の場合は `false` です。
	 */
	export const prerendering: boolean;
	/**
	 * アプリが動作している Vite.js のモードを示します。`config.kit.vite.mode` で設定可能です。
	 * Vite.js は、`.env.[mode]` や `.env.[mode].local` のような、モードに関する dotenv ファイルを読み込みます。
	 * デフォルトでは、`svelte-kit dev` の場合は `mode=development` で、`svelte-kit build` の場合は `mode=production` で実行されます。
	 */
	export const mode: string;
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
	 * ナビゲーション後のページ更新の時にこれが(例えば `onMount` の中や action で)呼び出された場合、SvelteKit の組み込みのスクロール処理を無効にします。
	 * ユーザーの期待する動きではなくなるため、一般的には推奨されません。
	 */
	export function disableScrollHandling(): void;
	/**
	 * SvelteKit が指定された `href` にナビゲーションしたときに解決する Promise を返します(ナビゲーションに失敗した場合は、Promise はリジェクトされます)。
	 *
	 * @param href Where to navigate to
	 * @param opts.replaceState If `true`, will replace the current `history` entry rather than creating a new one with `pushState`
	 * @param opts.noscroll If `true`, the browser will maintain its scroll position rather than scrolling to the top of the page after navigation
	 * @param opts.keepfocus If `true`, the currently focused element will retain focus after navigation. Otherwise, focus will be reset to the body
	 * @param opts.state The state of the new/updated history entry
	 */
	export function goto(
		href: string,
		opts?: { replaceState?: boolean; noscroll?: boolean; keepfocus?: boolean; state?: any }
	): Promise<void>;
	/**
	 * 現在アクティブなページに属している `load` 関数が当該リソースを `fetch` する場合、再実行させます。それに続いてページが更新されたときに解決される `Promise` を返します。
	 * @param href The invalidated resource
	 */
	export function invalidate(href: string): Promise<void>;
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
	 * [`config.kit.paths.base`](/docs/configuration#paths) にマッチする文字列です。`/` で始まる必要があります。末尾を `/` にしてはいけません。
	 */
	export const base: `/${string}`;
	/**
	 * [`config.kit.paths.assets`](/docs/configuration#paths) にマッチする絶対パスです。
	 *
	 * > [`svelte-kit dev`](/docs/cli#svelte-kit-dev) や [`svelte-kit preview`](/docs/cli#svelte-kit-preview) を実行しているときはアセットがまだ最終的な URL に存在しないため、`config.kit.paths.assets` に値が指定されている場合はそれが `'/_svelte_kit_assets'` に置き換えられます。
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
	 * 書き込み可能なストアで、初期値は [`getSession`](/docs/hooks#getsession) の戻り値です。
	 * 書き込み可能ですがその変更内容をサーバー上で永続化しません。それはご自身で実装する必要があります。
	 */
	export const session: Writable<App.Session>;
	/**
	 *  読み取り可能なストアで、初期値は `false` です。もし [`version.pollInterval`](/docs/configuration#version) が0以外の値である場合、SvelteKit はアプリの新しいバージョンをポーリングし、それを検知するとこのストアの値を `true` にします。`updated.check()` は、ポーリングに関係なくすぐにチェックするよう強制します。
	 */
	export const updated: Readable<boolean> & { check: () => boolean };
}

/**
 * ```ts
 * import { build, files, prerendered, version } from '$service-worker';
 * ```
 *
 * このモジュールは [service workers](/docs/service-workers) でのみ使用できます。
 */
declare module '$service-worker' {
	/**
	 * Viteが生成するファイルを表すURL文字列の配列で、`cache.addAll(build)` を使ってキャッシュするのに適しています。
	 */
	export const build: string[];
	/**
	 * `static` ディレクトリまたは [`config.kit.files.assets`](/docs/configuration#files) で指定されたディレクトリにあるファイルを表すURL文字列の配列です。どのファイルを `static` ディレクトリに含めるかについては、[`config.kit.serviceWorker.files`](/docs/configuration#serviceworker) でカスタマイズできます。
	 */
	export const files: string[];
	/**
	 * プリレンダリングされたページとエンドポイントに合致するパス名の配列です。
	 */
	export const prerendered: string[];
	/**
	 * [`config.kit.version`](/docs/configuration#version) をご参照ください。これは、Service Worker 内で一意なキャッシュ名を生成するのに便利で、後でアプリをデプロイしたときに古いキャッシュを無効にすることができます。
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
declare module '@sveltejs/kit/install-fetch' {
	/**
	 * `node-fetch` を使用して、`fetch` `Headers` `Request` `Response` を global で利用できるようにします。
	 */
	export function installFetch(): void;
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
