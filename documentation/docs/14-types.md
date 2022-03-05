---
title: Types
---

**TYPES**

### Generated types

[`RequestHandler`](#sveltejs-kit-requesthandler) と [`Load`](#sveltejs-kit-load) の型はどちらも `Params` 引数を受け取りますが、その `params` オブジェクトに型を付けることができます。例えば、このエンドポイントは `foo`、`bar`、`baz` が渡されることを想定しています:

```js
/// file: src/routes/[foo]/[bar]/[baz].js
// @errors: 2355
/** @type {import('@sveltejs/kit').RequestHandler<{
 *   foo: string;
 *   bar: string;
 *   baz: string
 * }>} */
export async function get({ params }) {
	// ...
}
```

言うまでもなく、これを書くのは面倒で、移植性も低いです (`[foo]` ディレクトリを `[qux]` にリネームした場合、この型は実態を反映していないものとなります)。

この問題を解決するため、SvelteKit は各エンドポイント、各ページごとに `.d.ts` ファイルを生成します:

```ts
/// file: .svelte-kit/types/src/routes/[foo]/[bar]/[baz].d.ts
/// link: false
import type { RequestHandler as GenericRequestHandler, Load as GenericLoad } from '@sveltejs/kit';

export type RequestHandler<Body = any> = GenericRequestHandler<
	{ foo: string; bar: string; baz: string },
	Body
>;

export type Load<Props = Record<string, any>> = GenericLoad<
	{ foo: string; bar: string; baz: string },
	Props
>;
```

TypeScript の設定にある [`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) オプションのおかげで、エンドポイントとページではこれらのファイルが同じディレクトリにあるかのようにインポートすることができます:

```js
/// file: src/routes/[foo]/[bar]/[baz].js
// @filename: [baz].d.ts
import type { RequestHandler as GenericRequestHandler, Load as GenericLoad } from '@sveltejs/kit';

export type RequestHandler<Body = any> = GenericRequestHandler<
	{ foo: string, bar: string, baz: string },
	Body
>;

// @filename: index.js
// @errors: 2355
// ---cut---
/** @type {import('./[baz]').RequestHandler} */
export async function get({ params }) {
	// ...
}
```

```svelte
<script context="module">
	/** @type {import('./[baz]').Load} */
	export async function load({ params, fetch, session, stuff }) {
		// ...
	}
</script>
```

> これを動作させるためには、`tsconfig.json` または `jsconfig.json` が生成された `.svelte-kit/tsconfig.json` を継承する必要があります (`.svelte-kit` の場所は [`outDir`](/docs/configuration#outdir) です):
>
>     { "extends": "./.svelte-kit/tsconfig.json" }
