---
title: 高度なルーティング
---

## Restパラメータ <!--rest-parameters-->

ルートセグメント(route segments)の数がわからない場合は、rest 構文を使用することができます。例えば GitHub のファイルビューアのようなものを実装する場合は…

```bash
/[org]/[repo]/tree/[branch]/[...file]
```

…この場合、`/sveltejs/kit/tree/master/documentation/docs/04-advanced-routing.md` をリクエストすると、以下のパラメータをページで使うことができます:

```js
// @noErrors
{
	org: 'sveltejs',
	repo: 'kit',
	branch: 'master',
	file: 'documentation/docs/04-advanced-routing.md'
}
```

> `src/routes/a/[...rest]/z/+page.svelte` は `/a/z` にも (つまり、パラメータが全くない場合にも)、`/a/b/z` や `/a/b/c/z` と同様にマッチします。Rest パラメータの値が正しいことを、例えば [matcher](#matching) を使用するなどして確認してください。

### 404 pages

Rest パラメータによってカスタムの 404 をレンダリングすることができます。これらのルート(routes)があるとして…

```
src/routes/
├ marx-brothers/
│ ├ chico/
│ ├ harpo/
│ ├ groucho/
│ └ +error.svelte
└ +error.svelte
```

…もし `/marx-brothers/karl` にリクエストしても、`marx-brothers/+error.svelte` ファイルはレンダリング _されません_ 。なぜならどのルート(route) にもマッチしないからです。もしネストしたエラーページをレンダリングしたければ、どんな `/marx-brothers/*` リクエストにもマッチするルート(route)を作成し、そこから 404 を返すようにしてください:

```diff
src/routes/
├ marx-brothers/
+| ├ [...path]/
│ ├ chico/
│ ├ harpo/
│ ├ groucho/
│ └ +error.svelte
└ +error.svelte
```

```js
/// file: src/routes/marx-brothers/[...path]/+page.js
import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export function load(event) {
	error(404, 'Not Found');
}
```

> もし 404 のケースをハンドリングしていない場合、[`handleError`](hooks#shared-hooks-handleerror) によって表示が行われます。

## Optional parameters

`[lang]/home` というルートに含まれる `lang` というパラメータは必須です。これらのパラメータをオプションにできると、今回の例では `home` と `en/home` のどちらも同じページを指すことができるのでとても便利です。パラメータにもう1つ括弧を付けることでこれができるようになります: `[[lang]]/home`

optional のルートパラメータ(route parameter)は rest パラメータに続けて使用すること (`[...rest]/[[optional]]`) はできません。パラメータは 'greedily' にマッチし、optional のパラメータは使用されないこともあるためです。

## マッチング(Matching)

`src/routes/archive/[page]` のようなルート(route)は `/archive/3` にマッチしますが、`/archive/potato` にもマッチしてしまいます。これを防ぎたい場合、パラメータ文字列(`"3"` や `"potato"`)を引数に取ってそれが有効なら `true` を返す _matcher_ を [`params`](configuration#files) ディレクトリに追加することで、ルート(route)のパラメータを適切に定義することができます…

```js
/// file: src/params/integer.js
/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
	return /^\d+$/.test(param);
}
```

…そしてルート(routes)を拡張します:

```diff
-src/routes/archive/[page]
+src/routes/archive/[page=integer]
```

もしパス名がマッチしない場合、SvelteKit は (後述のソート順の指定に従って) 他のルートでマッチするか試行し、どれにもマッチしない場合は最終的に 404 を返します。

`params` ディレクトリにある各モジュールは matcher に対応しています。ただし、matcher のユニットテストに使用される `*.test.js` と `*.spec.js` ファイルは例外です。

> Matcher は サーバーとブラウザの両方で動作します。

## ソート(Sorting)

あるパスに対し、マッチするルート(routes)は複数でも構いません。例えば、これらのルート(routes)はどれも `/foo-abc` にマッチします:

```bash
src/routes/[...catchall]/+page.svelte
src/routes/[[a=x]]/+page.svelte
src/routes/[b]/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/foo-abc/+page.svelte
```

SvelteKit は、どのルート(route)に対してリクエストされているのかを判断しなければなりません。そのため、以下のルールに従ってこれらをソートします…

- より詳細・明確(specific)なルート(routes)ほど、より優先度が高い (例えば、動的なパラメータが1つあるルートより、パラメータのないルートのほうがより詳細・明確(specific)である、など)
- [matchers](#matching) 付きのパラメータ (`[name=type]`) は matchers なしのパラメータ (`[name]`) よりも優先度が高い
- `[[optional]]` と `[...rest]` パラメータはルート(route)の最後の部分でない限り無視される (最後の部分になっている場合は最も低い優先度として扱われる)。言い換えると、ソートの目的上、`x/[[y]]/z` と `x/z` は同等に扱われる
- 優先度が同じ場合はアルファベット順で解決される

…この順序で並べると、`/foo-abc` の場合は `src/routes/foo-abc/+page.svelte` を呼び出し、`/foo-def` の場合は `src/routes/foo-[c]/+page.svelte` を呼び出します:

```bash
src/routes/foo-abc/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/[[a=x]]/+page.svelte
src/routes/[b]/+page.svelte
src/routes/[...catchall]/+page.svelte
```

## エンコード(Encoding)

ファイルシステムでは使用できない文字があります — Linux と Mac では `/`、Windows では `\ / : * ? " < > |` です。URL においては、`#` と `%` には特別な意味がありますし、SvelteKit においては `[ ] ( )` に特別な意味があります。そのため、これらの文字をそのままルート(route)に使用することはできません。

これらの文字をルート(route)に使用するには、16進数のエスケープシーケンスを使います。`[x+nn]` というフォーマットで、`nn` の部分は16進数の文字コードです:

- `\` — `[x+5c]`
- `/` — `[x+2f]`
- `:` — `[x+3a]`
- `*` — `[x+2a]`
- `?` — `[x+3f]`
- `"` — `[x+22]`
- `<` — `[x+3c]`
- `>` — `[x+3e]`
- `|` — `[x+7c]`
- `#` — `[x+23]`
- `%` — `[x+25]`
- `[` — `[x+5b]`
- `]` — `[x+5d]`
- `(` — `[x+28]`
- `)` — `[x+29]`

例えば、`/smileys/:-)` というルート(route)を作る場合は、`src/routes/smileys/[x+3a]-[x+29]/+page.svelte` ファイルを作成します。

JavaScript を使って文字の16進数コードを判定することができます:

```js
':'.charCodeAt(0).toString(16); // '3a', hence '[x+3a]'
```

また、Unicode のエスケープシーケンスを使用することもできます。通常、エンコードされていない文字を直接使用することができるので、こうする必要はありませんが、何らかの理由で、例えばファイル名に絵文字を使用することができない場合、エスケープ文字を使用することができます。言い換えると、以下は同じことをしているということです:

```
src/routes/[u+d83e][u+dd2a]/+page.svelte
src/routes/🤪/+page.svelte
```

Unicode エスケープシーケンスのフォーマットは `[u+nnnn]` で、`nnnn` の部分は `0000` から `10ffff` までの適切な値です (JavaScript の文字列エスケープとは異なり、`ffff` 以上のコードポイントを表現するためにサロゲートペアを使用する必要はありません)。Unicode エンコーディングについてもっと知りたい方は、[Programming with Unicode](https://unicodebook.readthedocs.io/unicode_encodings.html) を参照してください。

> ディレクトリの先頭に `.` 文字があると、TypeScript で [問題](https://github.com/microsoft/TypeScript/issues/13399) が起きるため、例えば [`.well-known`](https://en.wikipedia.org/wiki/Well-known_URI) のようなルート(route)を作る場合はこれらの文字をエンコードしておくと良いでしょう: `src/routes/[x+2e]well-known/...`

## Advanced layouts

デフォルトでは、 _レイアウトの階層_ が _ルート(route)の階層_ に反映されます。場合によっては、そうしたくないこともあるかもしれません。

### (group)

'アプリ' のルート(routes)としてのレイアウト (例えば `/dashboard` や `/item`) が1つあり、'マーケティング' のルート(routes)としての別のレイアウト (`/about` や `/testimonials`) があるかもしれません。これらのルート(routes)を、ディレクトリの名前を括弧でくくることでグループ化することができます。通常のディレクトリとは異なり、`(app)` や `(marketing)` はそれらの中のルート(routes)の URL パス名には影響しません:

```diff
src/routes/
+│ (app)/
│ ├ dashboard/
│ ├ item/
│ └ +layout.svelte
+│ (marketing)/
│ ├ about/
│ ├ testimonials/
│ └ +layout.svelte
├ admin/
└ +layout.svelte
```

`+page` を `(group)` の中に直接配置することもできます (例えば、`/` が `(app)` や `(marketing)` のページであるべき場合など)。

### Breaking out of layouts

最上位のレイアウト(root layout)は、アプリの全てのページに適用されます。省略した場合、デフォルトは `<slot />` です。もし、いくつかのページで他のページとは異なるレイアウト階層を持ちたい場合には、アプリ全体を1つまたは複数のグループにして、共通のレイアウトを継承しないルート(route)を分けることができます。

上記の例で、`/admin` ルート(route)は `(app)` や `(marketing)` のレイアウトを継承しません。

### +page@

ページは、ルート(route)ごとに現在のレイアウト階層から抜け出すことができます。先ほどの例に出てきた `(app)` グループの中に、`/item/[id]/embed` ルート(route)があるとします:

```diff
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
+│ │ │ │ └ +page.svelte
│ │ │ └ +layout.svelte
│ │ └ +layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

通常、これは最上位のレイアウト(root layout)と `(app)` レイアウトと `item` レイアウトと `[id]` レイアウトを継承します。`@` と、その後ろにセグメント名 (最上位のレイアウト(root layout)の場合は空文字列(empty string)) を追加することで、これらのレイアウトのどれかにリセットすることができます。この例では、以下のオプションから選択できます:

- `+page@[id].svelte` -  `src/routes/(app)/item/[id]/+layout.svelte` を継承します
- `+page@item.svelte` - `src/routes/(app)/item/+layout.svelte` を継承します
- `+page@(app).svelte` - `src/routes/(app)/+layout.svelte` を継承します
- `+page@.svelte` - `src/routes/+layout.svelte` を継承します

```diff
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
+│ │ │ │ └ +page@(app).svelte
│ │ │ └ +layout.svelte
│ │ └ +layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

### +layout@

ページと同じように、同じ方法でレイアウト _自体_ をその親のレイアウトの階層から外すことができます。例えば、`+layout@.svelte` コンポーネントはその全ての子ルート(routes)の階層をリセットします。

```
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
│ │ │ │ └ +page.svelte  // (app)/item/[id]/+layout.svelte を使用します
│ │ │ ├ +layout.svelte  // (app)/item/+layout@.svelte を継承します
│ │ │ └ +page.svelte    // (app)/item/+layout@.svelte を使用します
│ │ └ +layout@.svelte   // 最上位のレイアウト(root layout)を継承し、(app)/+layout.svelte をスキップします
│ └ +layout.svelte
└ +layout.svelte
```

### レイアウトグループを使うときは <!--when-to-use-layout-groups-->

全てのユースケースがレイアウトのグループ化に適しているわけではありませんし、無理に使用する必要もありません。あなたのユースケースが複雑な `(group)` のネストになってしまうかもしれませんし、たった1つの例外ケースのために `(group)` を導入したくないかもしれません。コンポジション (再利用可能な `load` 関数や Svelte コンポーネント) や if 文など、他の手段を使用してやりたいことを実現するのは全く問題ありません。以下の例では、最上位のレイアウト(root layout)に戻し、他のレイアウトでも使用できるコンポーネントや関数を再利用したレイアウトを示しています:

```svelte
<!--- file: src/routes/nested/route/+layout@.svelte --->
<script>
	import ReusableLayout from '$lib/ReusableLayout.svelte';
	export let data;
</script>

<ReusableLayout {data}>
	<slot />
</ReusableLayout>
```

```js
/// file: src/routes/nested/route/+layout.js
// @filename: ambient.d.ts
declare module "$lib/reusable-load-function" {
	export function reusableLoad(event: import('@sveltejs/kit').LoadEvent): Promise<Record<string, any>>;
}
// @filename: index.js
// ---cut---
import { reusableLoad } from '$lib/reusable-load-function';

/** @type {import('./$types').PageLoad} */
export function load(event) {
	// Add additional logic here, if needed
	return reusableLoad(event);
}
```

## その他の参考情報 <!--further-reading-->

- [Tutorial: Advanced Routing](https://learn.svelte.jp/tutorial/optional-params)
