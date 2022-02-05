---
title: Modules
---

SvelteKit では、数多くのモジュールがアプリケーションで利用可能です。

### $app/env

```js
import { amp, browser, dev, mode, prerendering } from '$app/env';
```

- `amp` は `true` か `false` です。[プロジェクト設定](#configuration) の対応する値に依存します
- `browser` は `true` か `false` です。アプリが動作している場所がブラウザかサーバーかに依存します
- `dev` は開発者モードの場合 `true`、プロダクションだと `false` です
- `mode` は [Vite mode](https://ja.vitejs.dev/guide/env-and-mode.html#modes) です。`config.kit.vite.mode` で特に設定をしない限り、開発モードでは `development`、ビルド時には `production` となります
- `prerendering` は [プリレンダリング](#page-options-prerender) の場合は `true`、それ以外の場合は `false` です

### $app/navigation

```js
import {
	disableScrollHandling,
	goto,
	invalidate,
	prefetch,
	prefetchRoutes,
	beforeNavigate,
	afterNavigate
} from '$app/navigation';
```

- `afterNavigate(({ from, to }: { from: URL, to: URL }) => void)` - コンポーネントがマウントされたとき、およびコンポーネントがマウントされたままナビゲーションされたあとに実行されるライフサイクル関数です。
- `beforeNavigate(({ from, to, cancel }: { from: URL, to: URL | null, cancel: () => void }) => void)` — リンクをクリックしたり、`goto` を呼び出したり、ブラウザの 戻る/進む を使ったりして、ナビゲーションがトリガーされたときに実行される関数です。これには外部サイトへのナビゲーションも含まれます。ユーザーがページを閉じる場合、`to` は `null` になります。`cancel` を呼び出すと、ナビゲーションの進行を止めます。
- `disableScrollHandling` は、ナビゲーションに続いてページが更新されるときに(例えば `onMount` や action で)呼び出されると、SvelteKitが通常のスクロール管理を行うのを適用しないようにします。スクロールの動作に関するユーザーの期待を裏切ることになり混乱する可能性があるため、一般的にはこれを避けるべきです。
- `goto(href, { replaceState, noscroll, keepfocus, state })` は SvelteKit が指定された `href` にナビゲートしたときに解決するPromiseを返します(ナビゲートに失敗した場合は、そのプロミスはリジェクトされます)。第二引数はオプションです:
  - `replaceState` (boolean, デフォルトは `false`) もし `true` にした場合、`pushState` で新しい `history` エントリを作成するのではなく、現在の `history` エントリを置き換えます
  - `noscroll` (boolean, デフォルトは `false`) もし `true` にした場合、ブラウザはナビゲーション後にトップにスクロールせず、スクロールポジションを維持します
  - `keepfocus` (boolean, デフォルトは `false`) もし `true` にした場合、現在フォーカスされている要素はナビゲーション後もそのフォーカスを保持します。そうでない場合は、フォーカスがボディにリセットされます
  - `state` (object, デフォルトは `{}`) 新規作成/更新された履歴(history)エントリの状態
- `invalidate(href)` は、現在アクティブなページに含まれる全ての `load` 関数のうち、当該のリソースを `fetch` してるものについて全て再実行します。ページがその後更新されたときに解決する `Promise` を返します
- `prefetch(href)` はプログラムでページをプリフェッチします。つまり、a) そのページのコードがロード済か確認し、b) 適切なオプションでそのページの `load` を呼び出します。これは、SvelteKitのアプリで、ユーザーが `<a>` 要素をタップまたはマウスオーバーしたときに [sveltekit:prefetch](#anchor-options-sveltekit-prefetch) によってトリガーされる動作と同じです。次のナビゲーションがその `href` の場合、`load` から返された値が使用され、ナビゲーションが瞬時に行われます。これはプリフェッチが完了したときに解決される `Promise` を返します。
- `prefetchRoutes(routes)` — プログラムで、まだフェッチされていないルート(routes)のコードをプリフェッチします。一般的な使われ方としては、以降のナビゲーションを高速化するためにこれを呼び出します。引数を与えない場合は、全てのルート(routes)がフェッチされます。それ以外の場合、`/about` (`src/routes/about.svelte` にマッチ) や `/blog/*` (`src/routes/blog/[slug].svelte` にマッチ) など、任意のパス名でルートを指定することができます。`prefetch` とは違い、これは個別のページの `load` を呼び出しません。これはルート(routes)がプリフェッチされたときに解決される `Promise` を返します。

### $app/paths

```js
import { base, assets } from '$app/paths';
```

- `base` — [`config.kit.paths.base`](#configuration-paths) が指定されている場合、それにマッチするルート(root)からの相対パス (つまり `/` で始まる) 文字列で、未指定の場合は空の文字列です
- `assets` — [`config.kit.paths.assets`](#configuration-paths)が指定されている場合、それにマッチする絶対パス(URL)。指定されていない場合は `base` と同じです

> `config.kit.paths.assets` に値が指定されている場合、[`svelte-kit dev`](#command-line-interface-svelte-kit-dev) または [`svelte-kit preview`](#command-line-interface-svelte-kit-preview) を実行しているときはアセットがまだ最終的なURLに存在しないため、それは `'/_svelte_kit_assets'` に置き換えられます。

### $app/stores

```js
import { getStores, navigating, page, session } from '$app/stores';
```

ストアは _コンテクスチュアル(contextual)_ です — それらはルート(root)コンポーネントの [context](https://svelte.jp/tutorial/context-api) に追加されます。つまり、`session` と `page` はサーバー上の各リクエストごとにユニークで、同じサーバー上で同時に処理される複数のリクエストで共有されません。これにより、`session` にユーザー特有のデータを含めても安全になります。

そのため、ストアはフリーフローティング(free-floating)なオブジェクトではありません。`getContext` でアクセスしなければならないものと同様に、これはコンポーネントの初期化時にアクセスしなければなりません。

- `getStores` は `getContext` に付随する便利な関数で、`{ navigating, page, session }` を返します。これはトップレベルで呼び出すか、コンポーネントまたはページの初期化時に同期的に呼び出す必要があります。

ストア自体はサブスクリプションの時点で正しい context にアタッチします。そのため、ボイラープレートなしにコンポーネントで直接インポートして使用することができます。しかし、`$`接頭辞を使用していない場合は、コンポーネントやページの初期化時に同期的に呼び出す必要があります。代わりに `getStores` を使用して、安全に `.subscribe` を非同期で呼び出すことができます。

- `navigating` は [読み取り専用のストア(readable store)](https://svelte.jp/tutorial/readable-stores) です。ナビゲーションを開始すると、この値は `{ from, to }` になります。`from` と `to` はどちらも [`URL`](https://developer.mozilla.org/ja/docs/Web/API/URL) のインスタンスです。ナビゲーションが終了すると、値は `null` に戻ります。
- `page` は、現在の [`url`](https://developer.mozilla.org/ja/docs/Web/API/URL)、[`params`](#loading-input-params)、[`stuff`](#loading-output-stuff) 、[`status`](#loading-output-status)、[`error`](#loading-output-error) を含むオブジェクトです。
- `session` は [書き込み可能なストア(writable store)](https://svelte.jp/tutorial/writable-stores) で、初期値は [`getSession`](#hooks-getsession) の戻り値です。書き込めますが、その変更は永続化されません — それはあなた自身で実装する必要があります。

### $lib

これは `src/lib` または [`config.kit.files.lib`] に指定されたディレクトリのシンプルなエイリアスです。これにより、`../../../../` のようなナンセンスなことをせずに、共通コンポーネントやユーティリティモジュールにアクセスすることができます。

### $service-worker

このモジュールは [service workers](#service-workers) でのみ使用できます。

```js
import { build, files, timestamp } from '$service-worker';
```

- `build` はViteが生成するファイルを表すURL文字列の配列で、`cache.addAll(build)` を使ってキャッシュするのに適しています。
- `files` は、`static` ディレクトリまたは [`config.kit.files.assets`](#configuration) で指定されたディレクトリにあるファイルを表すURL文字列の配列です。どのファイルを `static` ディレクトリに含めるかについては、[`config.kit.serviceWorker.files`](#configuration) でカスタマイズできます。
- `timestamp` はビルド時に `Date.now()` を呼び出した結果です。これは、Service Worker 内で一意なキャッシュ名を生成するのに便利で、後でアプリをデプロイしたときに古いキャッシュを無効にすることができます。

### @sveltejs/kit/hooks

このモジュールは、複数の `handle` 呼び出しを順番に処理するためのヘルパー関数を提供します。

```js
import { sequence } from '@sveltejs/kit/hooks';

async function first({ event, resolve }) {
	console.log('first pre-processing');
	const result = await resolve(event);
	console.log('first post-processing');
	return result;
}
async function second({ event, resolve }) {
	console.log('second pre-processing');
	const result = await resolve(event);
	console.log('second post-processing');
	return result;
}

export const handle = sequence(first, second);
```

上記の例ではこのようにプリントされます:
>first pre-processing
>second pre-processing
>second post-processing
>first post-processing
