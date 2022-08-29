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

### Advanced layouts

By default, the _layout hierarchy_ mirrors the _route hierarchy_. In some cases, that might not be what you want.

#### (group)

Perhaps you have some routes that are 'app' routes that should have one layout (e.g. `/dashboard` or `/item`), and others that are 'marketing' routes that should have a different layout (`/blog` or `/testimonials`). We can group these routes with a directory whose name is wrapped in parentheses — unlike normal directories, `(app)` and `(marketing)` do not affect the URL pathname of the routes inside them:

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

You can also put a `+page` directly inside a `(group)`, for example if `/` should be an `(app)` or a `(marketing)` page.

Pages and layouts inside groups — as in any other directory — will inherit layouts above them, unless they _break out_ of the layout hierarchy as shown in the next section. In the above example, `(app)/+layout.svelte` and `(marketing)/+layout.svelte` both inherit `+layout.svelte`.

#### +page@

Conversely, some routes of your app might need to break out of the layout hierarchy. Let's add an `/item/[id]/embed` route inside the `(app)` group from the previous example:

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

Ordinarily, this would inherit the root layout, the `(app)` layout, the `item` layout and the `[id]` layout. We can reset to one of those layouts by appending `@` followed by the segment name — or, for the root layout, the empty string. In this example, we can choose from `+page@.svelte`, `+page@(app).svelte`, `+page@item.svelte` or `+page@[id].svelte`:

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

#### +layout@

Like pages, layouts can _themselves_ break out of their parent layout hierarchy, using the same technique. For example, a `+layout@.svelte` component would reset the hierarchy for all its child routes.

#### When to use layout groups

Not all use cases are suited for layout grouping, nor should you feel compelled to use them. It might be that your use case would result in complex `(group)` nesting, or that you don't want to introduce a `(group)` for a single outlier. It's perfectly fine to use other means such as composition (reusable `load` functions or Svelte components) or if-statements to achieve what you want. The following example shows a layout that rewinds to the root layout and reuses components and functions that other layouts can also use:

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
