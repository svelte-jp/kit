---
title: Packaging
---

SvelteKit では、アプリを構築するだけでなく、`@sveltejs/package` パッケージを使用してコンポーネントライブラリを構築することもできます (`npm create svelte` にはこれを設定するためのオプションがあります)。

アプリを作成するとき、`src/routes` のコンテンツが公開される部分となります。[`src/lib`](modules#$lib) にはアプリの内部ライブラリが含まれます。

コンポーネントライブラリは SvelteKit アプリと同じ構造ですが、`src/lib` が公開される部分である点が異なります。パッケージの公開にはプロジェクトの最上位(root)の `package.json` が使用されます。`src/routes` を、ライブラリに付属するドキュメントやデモサイト、または開発中に使用するサンドボックスにすることもあるでしょう。

`@sveltejs/package` の `svelte-package` コマンドを実行すると、`src/lib` の中身を取り込み、以下を含む `dist` ([設定で変更](#options)できます) ディレクトリを生成します:

- `src/lib` にある全てのファイル。Svelte コンポーネントはプリプロセスされ、TypeScript ファイルは JavaScript にトランスパイルされます。
- Svelte、JavaScript、TypeScript ファイル向けに生成される型定義 (`d.ts` ファイル)。このために、`typescript >= 4.0.0` をインストールする必要があります。型定義はその実装と同じ場所に配置され、手書きの `d.ts` ファイルはそのままコピーされます。[生成を無効](#options)にすることもできますが、それはおすすめできません。あなたのライブラリを使用する人は TypeScript を使用しているかもしれません。その場合、この型定義ファイルが必要になります。

> `@sveltejs/package` バージョン1は `package.json` を生成していましたが、この仕様は変更され、現在はプロジェクトの `package.json` を使用しそれが正しいか検証するようになりました。もしまだバージョン1を使用している場合は、[この PR](https://github.com/sveltejs/kit/pull/8922) にある移行手順(Migration instructions)をご覧ください。

## package.json の構造

公開するライブラリをビルドするのであれば、`package.json` の内容がとても重要になります。これを通して、パッケージのエントリーポイントや、どのファイルを npm に公開するか、そしてあなたのライブラリの依存関係を設定することができます。それでは、重要なフィールドをひとつずつ見ていきましょう。

### name

これはパッケージの名前です。他の人はこの名前を使用してインストールすることになります。そして `https://npmjs.com/package/<name>` のように表示されるようになります。

```json
{
	"name": "your-library"
}
```

詳細については[こちら](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#name)をお読みください。

### license

すべてのパッケージにはライセンスフィールドがあるべきです。なぜなら、人々はこれによってどのように使用することが許可されているのか知ることができるからです。配布や保証なしの再利用に関してとても寛容で、非常にポピュラーなライセンスとして、`MIT` があります。

```json
{
	"license": "MIT"
}
```

詳細については[こちら](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#license)をお読みください。`LICENSE` ファイルもパッケージに含めるとよいでしょう。

### files

ここではどのファイルを npm にアップロードするかを設定します。出力先フォルダ (デフォルトは `dist`) も含める必要があります。`package.json` と `README` と `LICENSE` は常に含まれるようになっているため、指定する必要はありません。

```json
{
	"files": ["dist"]
}
```

不要なファイル (例えば単体テストや、`src/routes` からのみインポートされているモジュールなど) を除外するには、`.npmignore` ファイルにそれらを追加します。これによってより小さいパッケージとなり、インストールも速くなります。

詳細については[こちら](https://docs.npmjs.com/cli/v9/configuring-npm/package-json#files)をお読みください。

### exports

`"exports"` フィールドにはパッケージのエントリーポイントを含めます。`npm create svelte@latest` を使用して新しいライブラリプロジェクトをセットアップした場合、単一の export として、パッケージの最上位(root)が設定されています:

```json
{
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
			"svelte": "./dist/index.js"
		}
	}
}
```

これにより、あなたのパッケージにはエントリーポイントが1つだけで、それは最上位(root)で、(以下のように)すべてここを通してインポートされるべきである、ということをバンドラーやツール類に伝えます:

```js
// @errors: 2307
import { Something } from 'your-library';
```

`types` と `svelte` キーは [export conditions](https://nodejs.org/api/packages.html#conditional-exports) です。これはツール類に、`your-library` インポートを検索する際にどのファイルをインポートするかを伝えるものです:

- TypeScript は `types` condition を見て、型定義ファイルを検索します。型定義を公開しない場合は、この condition を省略します。
- Svelte を認識するツール類は `svelte` condition を見て、これが Svelte コンポーネントライブラリであることを認識します。Svelte コンポーネントをエクスポートせず、Svelte 以外のプロジェクトでも使用できるライブラリ (例えば Svelte store ライブラリ) を公開する場合、この condition を `default` に置き換えることができます。

> 以前のバージョンの `@sveltejs/package` は `package.json` export も追加していましたが、現在は違います。すべてのツール類が明示的にエクスポートされていない `package.json` を扱うことができるようになったからです。

`exports` を好みに合わせて調整し、より多くのエントリーポイントを提供することができます。例えば、コンポーネントを再エクスポートする `src/lib/index.js` ファイルの代わりに、`src/lib/Foo.svelte` コンポーネントを直接公開したい場合、以下のような export map を作成できます…

```json
{
	"exports": {
		"./Foo.svelte": {
			"types": "./dist/Foo.svelte.d.ts",
			"svelte": "./dist/Foo.svelte"
		}
	}
}
```

…そしてライブラリの使用者はコンポーネントをこのようにインポートできます:

```js
// @filename: ambient.d.ts
declare module 'your-library/Foo.svelte';

// @filename: index.js
// ---cut---
import Foo from 'your-library/Foo.svelte';
```

> 型定義を提供している場合、これを行う際にさらなる注意が必要となることにお気をつけください。注意事項については[こちら](#typescript)をお読みください。

一般的に、exports map の各キーはユーザーがあなたのパッケージからなにかインポートするときに使用すべきパスであり、その値はインポートされるファイルへのパスか、またはそのファイルパスを含む export condition の map です。

`exports` の詳細については[こちら](https://nodejs.org/docs/latest-v18.x/api/packages.html#package-entry-points)をお読みください。

### svelte

これはツール類に Svelte コンポーネントライブラリを認識できるようにするレガシーなフィールドです。`svelte` [export condition](#anatomy-of-a-package-json-exports) を使用している場合は必要ありませんが、まだ export condition を認識しない古いツールとの後方互換性のために残しておくとよいでしょう。あなたの最上位(root)のエントリーポイントを指しているはずです。

```json
{
	"svelte": "./dist/index.js"
}
```

## TypeScript

あなたが TypeScript を使用していないとしても、あなたのライブラリの型定義を公開したほうがよいでしょう。あなたのライブラリを使用する人が、適切なインテリセンスを得られるようになるからです。`@sveltejs/package` は型生成のプロセスをほとんど隠ぺい(opaque)してくれます。デフォルトでは、ライブラリをパッケージングする際、JavaScript、TypeScript、Svelte ファイル向けに型定義を自動生成します。あなたは [exports](#anatomy-of-a-package-json-exports) map の `types` condition が正しいファイルを指しているか確認するだけです。`npm create svelte@latest` でライブラリプロジェクトを初期化すると、root export に `types` condition が設定されます。

しかし、root export 以外のもの、例えば `your-library/foo` インポートを提供する場合などは、型定義を提供する上でさらなる注意が必要です。残念ながら、TypeScript はデフォルトでは `{ "./foo": { "types": "./dist/foo.d.ts", ... }}` のような export に対して `types` condition を解決しません。代わりに、ライブラリの root からの相対で `foo.d.ts` を探します (つまり、`your-library/dist/foo.d.ts` ではなく `your-library/foo.d.ts` です)。これを修正する方法として、選択肢が2つあります:

1つ目の選択肢は、あなたのライブラリを使用する人に対し、`tsconfig.json` (または `jsconfig.json`) の `moduleResolution` オプション に `bundler` (TypeScript 5 から利用可能で、将来的にもベストかつ推奨のオプション) か `node16` か `nodenext` を設定してもらうように要求することです。これによって TypeScript が実際に exports map を見て正しく型を解決してくれるようになります。

2つ目の選択肢は、TypeScript の `typesVersions` 機能を使用(乱用)して、型を紐付けます。これは、TypeScript が TypeScript のバージョンによって異なる型定義をチェックするために使用している `package.json` 内のフィールドで、このためにパスマッピング機能があります。このパスマッピング機能を利用して、やりたいことを実現できます。上述の `foo` export の場合、対応する `typesVersions` はこのようになります:

```json
{
	"exports": {
		"./foo": {
			"types": "./dist/foo.d.ts",
			"svelte": "./dist/foo.js"
		}
	},
	"typesVersions": {
		">4.0": {
			"foo": ["./dist/foo.d.ts"]
		}
	}
}
```

`>4.0` は、TypeScript のバージョンが 4 より大きい場合、内側の map をチェックするよう TypeScript に伝えるものです (実際には常に true となるべきものです)。内側の map は TypeScript に `your-library/foo` に対する型付けが `./dist/foo.d.ts` にあることを伝えるためのもので、実質 `exports` condition を置き換えています。また、ワイルドカードとして `*` を自由に使用できるので、同じことを繰り返すことなくたくさんの型定義を一度で使用可能にすることができます。もし `typesVersions` を選択した場合、(`"index.d.ts": [..]` と定義されている) root import を含む全ての型のインポートを、これを通して宣言しなければならないことにご注意ください。

この機能についてより詳しい情報は[こちら](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#version-selection-with-typesversions)でお読み頂けます。

## ベストプラクティス

他の SvelteKit プロジェクトからのみ使用されることを想定しているのでなければ、`$app` などの [SvelteKit 固有のモジュール](modules)をあなたのパッケージで使用するのは避けたほうがよいでしょう。例えば、`import { browser } from '$app/environment'` を使用するのではなく、`import { BROWSER } from 'esm-env'` ([esm-env ドキュメント参照](https://github.com/benmccann/esm-env)) を使用します。また、`$app/stores` や `$app/navigation` などに直接頼るのではなく、現在の URL や navigation action をプロパティとして渡すこともできます。より一般的な方法でアプリを書くことによって、テストや UI デモなどのツールのセットアップも簡単になります。

[エイリアス](configuration#alias) は `svelte.config.js` (`vite.config.js` や `tsconfig.json` ではなく) を経由して追加するようにしてください。`svelte-package` で処理されるからです。.

パッケージに加えた変更がバグフィックスなのか、新機能なのか、それとも破壊的変更(breaking change)なのかをよく考えて、それに応じてパッケージのバージョンを更新する必要があります。もし既存のライブラリから `exports` やその中の `export` condition のパスを削除した場合、breaking change とみなされることにご注意ください。

```diff
{
	"exports": {
		".": {
			"types": "./dist/index.d.ts",
// changing `svelte` to `default` is a breaking change:
-			"svelte": "./dist/index.js"
+			"default": "./dist/index.js"
		},
// removing this is a breaking change:
-		"./foo": {
-			"types": "./dist/foo.d.ts",
-			"svelte": "./dist/foo.js",
-			"default": "./dist/foo.js"
-		},
// adding this is ok:
+		"./bar": {
+			"types": "./dist/bar.d.ts",
+			"svelte": "./dist/bar.js",
+			"default": "./dist/bar.js"
+		}
	}
}
```

## Options

`svelte-package` は以下のオプションを受け付けます:

- `-w`/`--watch` — `src/lib` にあるファイルの変更を関ししてパッケージを再ビルドします
- `-i`/`--input` — パッケージの全てのファイルを含む入力ディレクトリ。デフォルトは `src/lib` です
- `-o`/`--o` — 処理されたファイルが書き込まれる出力ディレクトリ。`package.json` の `exports` はここにあるファイルを指さなければならず、`files` の配列にはこのフォルダを含めなければいけません。デフォルトは `dist` です
- `-t`/`--types` — 型定義 (`d.ts` ファイル) を作成するかどうか。エコシステムのライブラリの品質を向上させるため、作成することを強く推奨します。デフォルトは `true` です

## 公開(Publishing)

生成されたパッケージを公開するには:

```sh
npm publish
```

## 注意事項

すべての相対ファイルインポートは、Node の ESM アルゴリズムに従って、フルで指定する必要があります。つまり、`src/lib/something/index.js` のようなファイルには、ファイル名と拡張子を含めなければなりません。

```diff
-import { something } from './something';
+import { something } from './something/index.js';
```

TypeScript を使用している場合、同じように `.ts` ファイルをインポートする必要がありますが、`.js` ファイルの末尾を使用する必要があります、`.ts` ファイルの末尾ではありません (これは TypeScript の設計上の決定によるもので、私たちの管轄外です)。`tsconfig.json` または `jsconfig.json` に `"moduleResolution": "NodeNext"` を設定すると、これに対処できます。

Svelte ファイル (プロプロセスされる) と TypeScript ファイル (JavaScript にトランスパイルされる) を覗いて、全てのファイルはそのままコピーされます。
