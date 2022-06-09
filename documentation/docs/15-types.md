---
title: Types
---

**TYPES**

### Generated types

`RequestHandler` と `Load` の型はどちらも `Params` 引数を受け取りますが、その `params` オブジェクトに型を付けることができます。例えば、このエンドポイントは `foo`、`bar`、`baz` が渡されることを想定しています:

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
/// file: .svelte-kit/types/src/routes/[foo]/[bar]/__types/[baz].d.ts
/// link: false
import type { RequestHandler as GenericRequestHandler, Load as GenericLoad } from '@sveltejs/kit';

export type RequestHandler<Body = any> = GenericRequestHandler<
	{ foo: string; bar: string; baz: string },
	Body
>;

export type Load<
	InputProps extends Record<string, any> = Record<string, any>,
	OutputProps extends Record<string, any> = InputProps
> = GenericLoad<{ foo: string; bar: string; baz: string }, InputProps, OutputProps>;
```

TypeScript の設定にある [`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) オプションのおかげで、エンドポイントとページではこれらのファイルが同じディレクトリにあるかのようにインポートすることができます:

```js
/// file: src/routes/[foo]/[bar]/[baz].js
// @filename: __types/[baz].d.ts
import type { RequestHandler as GenericRequestHandler, Load as GenericLoad } from '@sveltejs/kit';

export type RequestHandler<Body = any> = GenericRequestHandler<
	{ foo: string, bar: string, baz: string },
	Body
>;

// @filename: index.js
// @errors: 2355
// ---cut---
/** @type {import('./__types/[baz]').RequestHandler} */
export async function get({ params }) {
	// ...
}
```

```svelte
<script context="module">
	/** @type {import('./__types/[baz]').Load} */
	export async function load({ params, fetch, session, stuff }) {
		// ...
	}
</script>
```

> これを動作させるためには、`tsconfig.json` または `jsconfig.json` が生成された `.svelte-kit/tsconfig.json` を継承する必要があります (`.svelte-kit` の場所は [`outDir`](/docs/configuration#outdir) です):
>
>     { "extends": "./.svelte-kit/tsconfig.json" }

#### Default tsconfig.json

生成された `.svelte-kit/tsconfig.json` ファイルには様々なオプションが含まれています。いくつかのオプションはプロジェクトの設定に基づいてプログラム的に生成されており、通常は、適切な理由なしに上書きするべきではありません。

```json
/// file: .svelte-kit/tsconfig.json
{
	"compilerOptions": {
		"baseUrl": "..",
		"paths": {
			"$lib": "src/lib",
			"$lib/*": "src/lib/*"
		},
		"rootDirs": ["..", "./types"]
	},
	"include": ["../src/**/*.js", "../src/**/*.ts", "../src/**/*.svelte"],
	"exclude": ["../node_modules/**", "./**"]
}
```

その他のオプションは SvelteKit が正常に動作するために必要なものであり、変更したときに何が起こるのか把握していないのであれば、そのままにしておく必要があります:

```json
/// file: .svelte-kit/tsconfig.json
{
	"compilerOptions": {
		// this ensures that types are explicitly
		// imported with `import type`, which is
		// necessary as svelte-preprocess cannot
		// otherwise compile components correctly
		"importsNotUsedAsValues": "error",

		// Vite compiles one TypeScript module
		// at a time, rather than compiling
		// the entire module graph
		"isolatedModules": true,

		// TypeScript cannot 'see' when you
		// use an imported value in your
		// markup, so we need this
		"preserveValueImports": true,

		// This ensures both `svelte-kit build`
		// and `svelte-kit package` work correctly
		"lib": ["esnext", "DOM"],
		"moduleResolution": "node",
		"module": "esnext",
		"target": "esnext"
	}
}
```
