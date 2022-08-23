---
title: Packaging
---

> `svelte-package` is currently experimental. Non-backward compatible changes may occur in any future release.

You can use SvelteKit to build apps as well as component libraries, using the `@sveltejs/package` package (`npm create svelte` has an option to set this up for you).

アプリを作成するとき、`src/routes` のコンテンツが公開される部分となります。[`src/lib`](/docs/modules#$lib) にはアプリの内部ライブラリが含まれます。

SvelteKit コンポーネントライブラリは、SvelteKitアプリと全く同じ構造を持ちますが、`src/lib` も公開される点が異なります。`src/routes` はライブラリに付随するドキュメントやデモサイトにもできますし、開発中に使用できるサンドボックスにもできます。

Running the `svelte-package` command from `@sveltejs/package` will take the contents of `src/lib` and generate a `package` directory (which can be [configured](/docs/configuration#package)) containing the following:

- All the files in `src/lib`, unless you [configure](/docs/configuration#package) custom `include`/`exclude` options. Svelte components will be preprocessed, TypeScript files will be transpiled to JavaScript.
- Type definitions (`d.ts` files) which are generated for Svelte, JavaScript and TypeScript files. You need to install `typescript >= 4.0.0` for this. Type definitions are placed next to their implementation, hand-written `d.ts` files are copied over as is. You can [disable generation](/docs/configuration#package), but we strongly recommend against it.
- A `package.json` copied from the project root with all fields except `"scripts"`, `"publishConfig.directory"` and `"publishConfig.linkDirectory"`. The `"dependencies"` field is included, which means you should add packages that you only need for your documentation or demo site to `"devDependencies"`. A `"type": "module"` and an `"exports"` field will be added if it's not defined in the original file.

`"exports"` フィールドにはパッケージのエントリーポイントが含まれます。デフォルトでは、アンダースコアで始まるファイル(またはアンダースコアで始まるディレクトリにあるファイル)を除いて、`src/lib` にある全てのファイルをエントリーポイントとして扱いますが、この動作は [設定可能](/docs/configuration#package) です。もし `src/lib/index.js` や `src/lib/index.svelte` ファイルがある場合は、それがパッケージルートとして扱われます。

例えば、`src/lib/Foo.svelte` コンポーネントと、それを再エクスポートした `src/lib/index.js` モジュールがあった場合、ライブラリの利用者は次のどちらかを行うことができます。

```js
// @filename: ambient.d.ts
declare module 'your-library';

// @filename: index.js
// ---cut---
import { Foo } from 'your-library';
```

```js
// @filename: ambient.d.ts
declare module 'your-library/Foo.svelte';

// @filename: index.js
// ---cut---
import Foo from 'your-library/Foo.svelte';
```

### Publishing

生成されたパッケージをパブリッシュするには:

```sh
npm publish ./package
```

上記の `./package` は生成されるディレクトリ名を参照しています。カスタムで [`package.dir`](/docs/configuration#package) を設定している場合は、適宜変更してください。

### 注意事項

All relative file imports need to be fully specified, adhering to Node's ESM algorithm. This means you cannot import the file `src/lib/something/index.js` like `import { something } from './something`, instead you need to import it like this: `import { something } from './something/index.js`. If you are using TypeScript, you need to import `.ts` files the same way, but using a `.js` file ending, _not_ a `.ts` file ending (this isn't under our control, the TypeScript team has made that decision). Setting `"moduleResolution": "NodeNext"` in your `tsconfig.json` or `jsconfig.json` will help you with this.

This is a relatively experimental feature and is not yet fully implemented. All files except Svelte files (preprocessed) and TypeScript files (transpiled to JavaScript) are copied across as-is.
