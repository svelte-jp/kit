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

これでカスタムの 404 をレンダリングすることもできます。これらのルート(routes)がある場合…

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

> `src/routes/a/[...rest]/z/+page.svelte` は `/a/z` (つまり、パラメータがない場合) にマッチしますし、`/a/b/z` や `/a/b/c/z` などにも同様にマッチします。rest パラメータの値が有効であることを、例えば [matcher](#advanced-routing-matching) などを使用して、確実にチェックしてください。

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
- [matchers](#advanced-routing-matching) 付きのパラメータ (`[name=type]`) は matchers なしのパラメータ (`[name]`) よりも優先度が高い
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

### 名前付きレイアウト(Named layouts)

アプリには、デフォルトのレイアウトとは違うレイアウトが必要になる部分もあるでしょう。そういったケースには、 _名前付きレイアウト(named layouts)_ を作成することができます…

```svelte
/// file: src/routes/+layout-foo.svelte
<div class="foo">
	<slot></slot>
</div>
```

…そしてファイル名にあるレイアウトの名前(上記の例では `foo`) を参照し、それを使用します:

```svelte
/// file: src/routes/my-special-page/+page@foo.svelte
<h1>I am inside +layout-foo</h1>
```

> 名前付きレイアウト(Named layout)は Svelte ファイルからのみ参照するようにしてください

名前付きレイアウト(Named layouts)はとてもパワフルですが、理解するのに少し時間がかかるかもしれません。一度で理解できなくてもご心配なく。

#### スコープ(Scoping)

名前付きレイアウト(Named layouts)は任意の深さに作成することができ、同じサブツリーにあるどのコンポーネントにも適用されます。例えば、 `+layout-foo` は `/x/one` と `/x/two` に適用されますが、`/x/three` や `/four` には適用されません:

```bash
src/routes/
├ x/
│ ├ +layout-foo.svelte
│ ├ one/+page@foo.svelte       # ✅ page has `@foo`
│ ├ two/+page@foo.svelte       # ✅ page has `@foo`
│ └ three/+page.svelte         # ❌ page does not have `@foo`
└ four/+page@foo.svelte        # ❌ page has `@foo`, but +layout-foo is not 'in scope'
```

#### 継承チェーン(Inheritance chains)

レイアウトは、同じディレクトリまたは親ディレクトリにある名前付きレイアウト(named layouts)を継承するかどうか選択できます。例えば `x/y/+layout@root.svelte` には名前が付いていないため、`/x/y` のデフォルトのレイアウトです (つまり、`/x/y/one`、`/x/y/two`、`/x/y/three` はどれもこのレイアウトを継承します)。`@root` を指定しているため、もっとも近くにある `+layout-root.svelte` を直接継承することになり、`+layout.svelte` と `x/+layout.svelte` をスキップします。

```
src/routes/
├ x/
│ ├ y/
│ │ ├ +layout@root.svelte
│ │ ├ one/+page.svelte
│ │ ├ two/+page.svelte
│ │ └ three/+page.svelte
│ └ +layout.svelte
├ +layout.svelte
└ +layout-root.svelte
```

> `+layout-root.svelte` が単独の `<slot />` のみを含んでいる場合、アプリ内のネストレイアウト(nested layout)に `@root` を付けることで、任意のページをブランクレイアウトに 'リセット' することができます。

親が指定されていない場合、レイアウトはツリー上もっとも近くにあるデフォルトのレイアウト(つまり名前が付いていないレイアウト)を継承することになります。例えば `+layout-root.svelte` が `+layout.svelte` を継承するように、名前付きレイアウト(named layout)がそのツリーに並ぶデフォルトレイアウトを継承していると便利な場合があります。明示的に `@default` を指定することでこれができ、`/x/y/one` とその兄弟がアプリのデフォルトのレイアウトを使用するのに `x/+layout.svelte` を使う必要がなくなります:

```diff
src/routes/
├ x/
│ ├ y/
│ │ ├ +layout@root.svelte
│ │ ├ one/+page.svelte
│ │ ├ two/+page.svelte
│ │ └ three/+page.svelte
│ └ +layout.svelte
├ +layout.svelte
-└ +layout-root.svelte
+└ +layout-root@default.svelte
```

> `default` は予約済の名前です。言い換えると、`+layout-default.svelte` というファイルを使用することはできないということです。
