---
title: レイアウト
---

ここまで、ページを完全に独立したコンポーネントとして扱ってきました — ナビゲーションを行うと、既存のコンポーネントは破棄され、新しいコンポーネントがその場所を引き継ぎます。

しかし、多くのアプリでは、トップレベルのナビゲーションやフッターなど、全てのページで表示されるべき要素が存在します。それらを全てのページで繰り返し書くのではなく、_レイアウト(layout)_ コンポーネントを使うことができます。

全てのページに適用されるレイアウトを作るには、`src/routes/__layout.svelte` というファイルを作成します。(自分で作成していない場合に使用される)デフォルトのレイアウトは、以下のようなものです…

```html
<slot></slot>
```

…ですが、お好みのマークアップ、スタイル、動作を追加できます。ただし、コンポーネントがページコンテンツ用の `<slot>` を含んでいる必要があります。例えば、ナビゲーションバー(nav bar)を追加してみるとしましょう。

```html
/// file: src/routes/__layout.svelte
<nav>
	<a href="/">Home</a>
	<a href="/about">About</a>
	<a href="/settings">Settings</a>
</nav>

<slot></slot>
```

`/`、`/about`、`/settings` 用のページを作成してみます…

```html
/// file: src/routes/index.svelte
<h1>Home</h1>
```

```html
/// file: src/routes/about.svelte
<h1>About</h1>
```

```html
/// file: src/routes/settings.svelte
<h1>Settings</h1>
```

...nav は常に表示され、3つのページリンクをそれぞれクリックすると、`<h1>` が置き換えられるだけです。

### ネストレイアウト

単一の `/settings` ページを持つのではなく、`/settings/profile` や `/settings/notifications` といったページをネストして(※入れ子にして)サブメニューを共有するとします (実例としては、[github.com/settings](https://github.com/settings) をご覧ください)。

(Topレベルの nav を持つルートレイアウト(root layout)を継承しつつ) `/settings` 以下のページにのみ適用されるレイアウトを作成することができます。

```html
/// file: src/routes/settings/__layout.svelte
<h1>Settings</h1>

<div class="submenu">
	<a href="/settings/profile">Profile</a>
	<a href="/settings/notifications">Notifications</a>
</div>

<slot></slot>
```

### Named layouts

Some parts of your app might need something other than the default layout. For these cases you can create _named layouts_...

```svelte
/// file: src/routes/__layout-foo.svelte
<div class="foo">
	<slot></slot>
</div>
```

...and then use them by referencing the layout name (`foo`, in the example above) in the filename:

```svelte
/// file: src/routes/my-special-page@foo.svelte
<h1>I am inside __layout-foo</h1>
```

Named layouts are very powerful, but it can take a minute to get your head round them. Don't worry if this doesn't make sense all at once.

#### Scoping

Named layouts can be created at any depth, and will apply to any components in the same subtree. For example, `__layout-foo` will apply to `/x/one` and `/x/two`, but not `/x/three` or `/four`:

```
src/routes/
├ x/
│ ├ __layout-foo.svelte
│ ├ one@foo.svelte
│ ├ two@foo.svelte
│ └ three.svelte
└ four@foo.svelte
```

#### Inheritance chains

Layouts can themselves choose to inherit from named layouts, from the same directory or a parent directory. For example, `x/y/__layout@root.svelte` is the default layout for `/x/y` (meaning `/x/y/one`, `/x/y/two` and `/x/y/three` all inherit from it) because it has no name. Because it specifies `@root`, it will inherit directly from the nearest `__layout-root.svelte`, skipping `__layout.svelte` and `x/__layout.svelte`.

```
src/routes/
├ x/
│ ├ y/
│ │ ├ __layout@root.svelte
│ │ ├ one.svelte
│ │ ├ two.svelte
│ │ └ three.svelte
│ └ __layout.svelte
├ __layout.svelte
└ __layout-root.svelte
```

> In the case where `__layout-root.svelte` contains a lone `<slot />`, this effectively means we're able to 'reset' to a blank layout for any page or nested layout in the app by adding `@root`.

If no parent is specified, a layout will inherit from the nearest default (i.e. unnamed) layout _above_ it in the tree. In some cases, it's helpful for a named layout to inherit from a default layout _alongside_ it in the tree, such as `__layout-root.svelte` inheriting from `__layout.svelte`. We can do this by explicitly specifying `@default`, allowing `/x/y/one` and siblings to use the app's default layout without using `x/__layout.svelte`:

```diff
src/routes/
├ x/
│ ├ y/
│ │ ├ __layout@root.svelte
│ │ ├ one.svelte
│ │ ├ two.svelte
│ │ └ three.svelte
│ └ __layout.svelte
├ __layout.svelte
-└ __layout-root.svelte
+└ __layout-root@default.svelte
```

> `default` is a reserved name — in other words, you can't have a `__layout-default.svelte` file.

### エラーページ

ページがロード([Loading](/docs/loading)を参照)に失敗した場合、SvelteKitはエラーページ(error page)をレンダリングします。レイアウトやページと一緒に `__error.svelte` コンポーネントを作ることで、このページをカスタマイズすることができます。

例えば、`src/routes/settings/notifications/index.svelte` でロードに失敗した場合、`src/routes/settings/notifications/__error.svelte` が存在すればSveltekitはそれを同じレイアウトでレンダリングします。もし存在しなければ、`src/routes/settings/__error.svelte` を親のレイアウトでレンダリングします。もしそれも存在しなければ、 `src/routes/__error.svelte` をルートレイアウト(root layout) でレンダリングします。

> SvelteKit はデフォルトのエラーページを提供してますが、ご自身で `src/routes/__error.svelte` を用意することを推奨します。

エラーコンポーネントに [`load`](/docs/loading) 関数がある場合、`error` プロパティと `status` プロパティが引数に渡されて呼び出されます。

```html
<script context="module">
	/** @type {import('@sveltejs/kit').ErrorLoad} */
	export function load({ error, status }) {
		return {
			props: {
				title: `${status}: ${error.message}`
			}
		};
	}
</script>

<script>
	export let title;
</script>

<h1>{title}</h1>
```

> レイアウトでは、[page store](/docs/modules#$app-stores) を使って `error` と `status` にアクセスすることもできます。  
>
> ユーザーに特権的な情報が公開されないようにするため、本番環境では `error` からサーバーサイドのスタックトレースが取り除かれます。

#### 404s

Nested error pages are only rendered when an error occurs while rendering a specific page. In the case of a request that doesn't match any existing route, SvelteKit will render a generic 404 instead. For example, given these routes...

```
src/routes/
├ __error.svelte
├ marx-brothers/
│ ├ __error.svelte
│ ├ chico.svelte
│ ├ harpo.svelte
│ └ groucho.svelte
```

...the `marx-brothers/__error.svelte` file will _not_ be rendered if you visit `/marx-brothers/karl`. If you want to render the nested error page, you should create a route that matches any `/marx-brothers/*` request, and return a 404 from it:

```diff
src/routes/
├ __error.svelte
├ marx-brothers/
│ ├ __error.svelte
+│ ├ [...path].svelte
│ ├ chico.svelte
│ ├ harpo.svelte
│ └ groucho.svelte
```

```svelte
/// file: src/routes/marx-brothers/[...path.svelte]
<script context="module">
	/** @type {import('./[...path]').Load} */
	export function load({ params }) {
		return {
			status: 404,
			error: new Error(`Not found: /marx-brothers/${params.path}`)
		};
	}
</script>
```
