---
title: Packaging
---

SvelteKit は、アプリだけでなくコンポーネントライブラリを構築するのにもお使いいただけます。

アプリを作成するとき、`src/routes` のコンテンツが公開される部分となります。[`src/lib`](/docs/modules#$lib) にはアプリの内部ライブラリが含まれます。

SvelteKit コンポーネントライブラリは、SvelteKitアプリと全く同じ構造を持ちますが、`src/lib` も公開される点が異なります。`src/routes` はライブラリに付随するドキュメントやデモサイトにもできますし、開発中に使用できるサンドボックスにもできます。

`svelte-kit package` を実行すると、`src/lib` のコンテンツが使用され、以下の内容を含む `package` ディレクトリ (これは [設定で変更可能](/docs/configuration#package)) が生成されます:

- カスタムで `include`/`exclude` オプションを [設定](/docs/configuration#package) しない限り、`src/lib` にある全てのファイルが含まれます。Svelte コンポーネントはプリプロセスされ、TypeScript ファイルは JavaScript にトランスパイルされます。
- Svelte、JavaScript、TypeScriptファイルのために生成される型定義 (`d.ts` ファイル)。これを行うためには、`typescript >= 4.0.0` と `svelte2tsx >= 0.4.1` をインストールする必要があります。型定義は実装の隣に置かれ、手書きの `d.ts` ファイルはそのままコピーされます。[生成を無効化](/docs/configuration#package) することもできますが、あまりおすすめしません。
- プロジェクトのルートからコピーされた `package.json` から `"scripts"` フィールドを取り除き、`"type": "module"` を追加したもの。また、`"exports"` フィールドも、オリジナルのファイルで定義されていない場合は追加されます。
- プロジェクトのルートからコピーされた `package.json` には、`"scripts"` フィールドを除く全てのフィールドが含まれています。`"dependencies"` フィールドが含まれているため、ドキュメントやデモサイトにのみ必要なパッケージは `"devDependencies"` に追加してください。`"type": "module"` と `"exports"` フィールドは、オリジナルのファイルで定義されていない場合に追加されます。

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

比較的、これは実験的な機能であり、まだ完全に実装されていません。Svelte ファイル(プリプロセス済)と TypeScript ファイル(JavaScriptにトランスパイル済)を除き、全てのファイルはそのままコピーされます。
