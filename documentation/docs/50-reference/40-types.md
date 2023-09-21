---
title: Types
---

## Public types

以下の型は `@sveltejs/kit` からインポートすることができます:

> TYPES: @sveltejs/kit

## Private types

以下は上記の public types から参照されていますが、直接インポートすることはできません:

> TYPES: Private types

## Generated types

`RequestHandler` と `Load` の型はどちらも `Params` 引数を受け取りますが、その `params` オブジェクトに型を付けることができます。例えば、このエンドポイントは `foo`、`bar`、`baz` が渡されることを想定しています:

```js
/// file: src/routes/[foo]/[bar]/[baz]/+page.server.js
// @errors: 2355 2322 1360
/** @type {import('@sveltejs/kit').RequestHandler<{
    foo: string;
    bar: string;
    baz: string
  }>} */
export async function GET({ params }) {
	// ...
}
```

言うまでもなく、これを書くのは面倒で、移植性も低いです (`[foo]` ディレクトリを `[qux]` にリネームした場合、この型は実態を反映していないものとなります)。

この問題を解決するため、SvelteKit は各エンドポイント、各ページごとに `.d.ts` ファイルを生成します:

```ts
/// file: .svelte-kit/types/src/routes/[foo]/[bar]/[baz]/$types.d.ts
/// link: false
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string;
}

export type PageServerLoad = Kit.ServerLoad<RouteParams>;
export type PageLoad = Kit.Load<RouteParams>;
```

TypeScript の設定にある [`rootDirs`](https://www.typescriptlang.org/tsconfig#rootDirs) オプションのおかげで、エンドポイントとページではこれらのファイルが同じディレクトリにあるかのようにインポートすることができます:

```js
/// file: src/routes/[foo]/[bar]/[baz]/+page.server.js
// @filename: $types.d.ts
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string;
}

export type PageServerLoad = Kit.ServerLoad<RouteParams>;

// @filename: index.js
// @errors: 2355
// ---cut---
/** @type {import('./$types').PageServerLoad} */
export async function GET({ params }) {
	// ...
}
```

```js
/// file: src/routes/[foo]/[bar]/[baz]/+page.js
// @filename: $types.d.ts
import type * as Kit from '@sveltejs/kit';

type RouteParams = {
	foo: string;
	bar: string;
	baz: string;
}

export type PageLoad = Kit.Load<RouteParams>;

// @filename: index.js
// @errors: 2355
// ---cut---
/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
	// ...
}
```

> これを動作させるためには、`tsconfig.json` または `jsconfig.json` が生成された `.svelte-kit/tsconfig.json` を継承する必要があります (`.svelte-kit` の場所は [`outDir`](configuration#outdir) です):
>
> `{ "extends": "./.svelte-kit/tsconfig.json" }`

### Default tsconfig.json

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

		// This ensures both `vite build`
		// and `svelte-package` work correctly
		"lib": ["esnext", "DOM", "DOM.Iterable"],
		"moduleResolution": "node",
		"module": "esnext",
		"target": "esnext"
	}
}
```

## App

> TYPES: App
