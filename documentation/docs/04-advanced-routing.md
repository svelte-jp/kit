---
title: 高度なルーティング
---

### Restパラメータ

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

> `src/routes/a/[...rest]/z/+page.svelte` は `/a/z` にも (つまり、パラメーターが全くない場合にも)、`/a/b/z` や `/a/b/c/z` と同様にマッチします。Rest パラメーターの値が正しいことを、例えば [matcher](#matching) を使用するなどして確認してください。

#### 404 pages

Rest パラメーターによってカスタムの 404 をレンダリングすることができます。これらのルート(routes)があるとして…

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
	throw error(404, 'Not Found');
}
```

> もし 404 のケースをハンドリングしていない場合、[`handleError`](/docs/hooks#shared-hooks-handleerror) によって表示が行われます。

### マッチング(Matching)

`src/routes/archive/[page]` のようなルート(route)は `/archive/3` にマッチしますが、`/archive/potato` にもマッチしてしまいます。これを防ぎたい場合、パラメータ文字列(`"3"` や `"potato"`)を引数に取ってそれが有効なら `true` を返す _matcher_ を [`params`](/docs/configuration#files) ディレクトリに追加することで、ルート(route)のパラメータを適切に定義することができます…

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

> Matcher は サーバーとブラウザの両方で動作します。

### ソート(Sorting)

あるパスに対し、マッチするルート(routes)は複数でも構いません。例えば、これらのルート(routes)はどれも `/foo-abc` にマッチします:

```bash
src/routes/[...catchall]/+page.svelte
src/routes/[a]/+server.js
src/routes/[b]/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/foo-abc/+page.svelte
```

SvelteKit は、どのルート(route)に対してリクエストされているのかを判断しなければなりません。そのため、以下のルールに従ってこれらをソートします…

- より詳細・明確(specific)なルート(routes)ほど、より優先度が高い (例えば、動的なパラメータが1つあるルートより、パラメータのないルートのほうがより詳細・明確(specific)である、など)
- `+server` ファイルは `+page` ファイルより優先度が高い
- [matchers](#matching) 付きのパラメータ (`[name=type]`) は matchers なしのパラメータ (`[name]`) よりも優先度が高い
- Rest パラメータは最も優先度が低い
- 優先度が同じ場合はアルファベット順で解決される

…この順序で並べると、`/foo-abc` の場合は `src/routes/foo-abc/+page.svelte` を呼び出し、`/foo-def` の場合は `src/routes/foo-[c]/+page.svelte` を呼び出します:

```bash
src/routes/foo-abc/+page.svelte
src/routes/foo-[c]/+page.svelte
src/routes/[a]/+server.js
src/routes/[b]/+page.svelte
src/routes/[...catchall]/+page.svelte
```

### エンコード(Encoding)

ディレクトリ名は URI デコードされるので、例えば `%40[username]` のようなディレクトリは `@` で始まる文字にマッチします:

```js
// @filename: ambient.d.ts
declare global {
	const assert: {
		equal: (a: any, b: any) => boolean;
	};
}

export {};

// @filename: index.js
// ---cut---
assert.equal(
	decodeURIComponent('%40[username]'),
	'@[username]'
);
```

`%` 文字を表すには `%25` を使用してください。そうしないと、不正確な結果となります。

### Advanced layouts

デフォルトでは、 _レイアウトの階層_ が _ルート(route)の階層_ に反映されます。場合によっては、そうしたくないこともあるかもしれません。

#### (group)

'アプリ' のルート(routes)としてのレイアウト (例えば `/dashboard` や `/item`) が1つあり、'マーケティング' のルート(routes)としての別のレイアウト (`/blog` や `/testimonials`) があるかもしれません。これらのルート(routes)を、ディレクトリの名前を括弧でくくることでグループ化することができます。通常のディレクトリとは異なり、`(app)` や `(marketing)` はそれらの中のルート(routes)の URL パス名には影響しません:

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

次のセクションで示すように、グループの中にあるページとレイアウトは他のディレクトリと同様、レイアウトの階層から外れない限り、その上のレイアウトを継承します。上記の例では、`(app)/+layout.svelte` と `(marketing)/+layout.svelte` はどちらも `+layout.svelte` を継承します。

#### +page@

逆に、アプリのルート(routes)によっては、レイアウトの階層から外す必要があるものがあるかもしれません。先程の例の `(app)` グループの中に `/item/[id]/embed` を追加してみましょう:

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
- `+page@[id].svelte` - inherits from `src/routes/(app)/item/[id]/+layout.svelte`
- `+page@item.svelte` - inherits from `src/routes/(app)/item/+layout.svelte`
- `+page@(app).svelte` - inherits from `src/routes/(app)/+layout.svelte`
- `+page@.svelte` - inherits from `src/routes/+layout.svelte`

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

There is no way to break out of the root layout. You can be sure that it's always present in your app and for example put app-wide UI or behavior in it.

#### +layout@

ページと同じように、同じ方法でレイアウト _自体_ をその親のレイアウトの階層から外すことができます。例えば、`+layout@.svelte` コンポーネントはその全ての子ルート(routes)の階層をリセットします。

```
src/routes/
├ (app)/
│ ├ item/
│ │ ├ [id]/
│ │ │ ├ embed/
│ │ │ │ └ +page.svelte  // uses (app)/item/[id]/+layout.svelte
│ │ │ └ +layout.svelte  // inherits from (app)/item/+layout@.svelte
│ │ │ └ +page.svelte    // uses (app)/item/+layout@.svelte
│ │ └ +layout@.svelte   // inherits from root layout, skipping (app)/+layout.svelte
│ └ +layout.svelte
└ +layout.svelte
```

#### レイアウトグループを使うときは

全てのユースケースがレイアウトのグループ化に適しているわけではありませんし、無理に使用する必要もありません。あなたのユースケースが複雑な `(group)` のネストになってしまうかもしれませんし、たった1つの例外ケースのために `(group)` を導入したくないかもしれません。コンポジション (再利用可能な `load` 関数や Svelte コンポーネント) や if 文など、他の手段を使用してやりたいことを実現するのは全く問題ありません。以下の例では、最上位のレイアウト(root layout)に戻し、他のレイアウトでも使用できるコンポーネントや関数を再利用したレイアウトを示しています:

```svelte
/// file: src/routes/nested/route/+layout@.svelte
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
