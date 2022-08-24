---
title: Packaging
---

> `svelte-package` は現時点では experimental です。将来のリリースで後方互換性のない変更が行われる可能性があります。

SvelteKit では、アプリを構築するだけでなく、`@sveltejs/package` パッケージを使用してコンポーネントライブラリを構築することもできます (`npm create svelte` にはこれを設定するためのオプションがあります)。

アプリを作成するとき、`src/routes` のコンテンツが公開される部分となります。[`src/lib`](/docs/modules#$lib) にはアプリの内部ライブラリが含まれます。

SvelteKit コンポーネントライブラリは、SvelteKitアプリと全く同じ構造を持ちますが、`src/lib` も公開される点が異なります。`src/routes` はライブラリに付随するドキュメントやデモサイトにもできますし、開発中に使用できるサンドボックスにもできます。

`@sveltejs/package` の `svelte-package` コマンドを実行すると、`src/lib` のコンテンツを使用して、以下を含む `package` ディレクトリ ([変更可能](/docs/configuration#package)) を生成します:

- カスタムで `include`/`exclude` オプションを [設定](/docs/configuration#package) しない限り、`src/lib` にある全てのファイルが含まれます。Svelte コンポーネントはプリプロセスされ、TypeScript ファイルは JavaScript にトランスパイルされます。
- Svelte、JavaScript、TypeScriptファイルのために生成される型定義 (`d.ts` ファイル)。これには `typescript >= 4.0.0` をインストールする必要があります。型定義は実装の隣に置かれ、手書きの `d.ts` ファイルはそのままコピーされます。[生成を無効化](/docs/configuration#package) するこおtもできますが、あまりおすすめしません。
- プロジェクトのルート(root)からコピーされた `package.json` から、`"scripts"`、`"publishConfig.directory"`、`"publishConfig.linkDirectory"` フィールドを取り除いたもの。`"dependencies"` フィールドは含まれているため、ドキュメントやデモサイトにのみ必要なパッケージは `"devDependencies"` に追加してください。`"type": "module"` と `"exports"` フィールドは、オリジナルのファイルで定義されていない場合に追加されます。

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

相対ファイルのインポートはすべて、Node の ESM アルゴリズムに従って完全に指定する必要があります。つまり、`src/lib/something/index.js` ファイルを `import { something } from './something` のようにインポートすることはできません。代わりに、`import { something } from './something/index.js` というようにインポートする必要があります。TypeScript を使用している場合は、`.ts` ファイルを同じ方法でインポートする必要がありますが、ファイルの末尾は `.ts` ではなく `.js` を使用します (これは我々の管理下ではんはく、TypeScript チームが決定したことです)。`tsconfig.json` または `jsconfig.json` で `"moduleResolution": "NodeNext"` と設定することで、この問題を解決できます。

比較的、これは実験的な機能であり、まだ完全に実装されていません。Svelte ファイル(プリプロセス済)と TypeScript ファイル(JavaScriptにトランスパイル済)を除き、全てのファイルはそのままコピーされます。
