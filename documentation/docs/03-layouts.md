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

### ネストレイアウト(Nested layouts)

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

### 名前付きレイアウト(Named layouts)

アプリには、デフォルトのレイアウトとは違うレイアウトが必要になる部分もあるでしょう。そういったケースには、_名前付きレイアウト(named layouts)_ を作成することができます…

```svelte
/// file: src/routes/__layout-foo.svelte
<div class="foo">
	<slot></slot>
</div>
```

…そしてレイアウトの名前(上記の例では `foo`)をファイル名で参照することによってこれを使用します:

```svelte
/// file: src/routes/my-special-page@foo.svelte
<h1>I am inside __layout-foo</h1>
```

名前付きレイアウト(Named layouts)はとてもパワフルですが、理解するのに少し時間がかかるかもしれません。一度に理解できなくても心配しないでください。

#### スコープ(Scoping)

名前付きレイアウト(Named layouts)は任意の深さに作成することができ、同じサブツリーにあるどのコンポーネントにも適用されます。例えば、`__layout-foo` は `/x/one` と `/x/two` に適用されますが、`/x/three` や `/four` には適用されません:

```
src/routes/
├ x/
│ ├ __layout-foo.svelte
│ ├ one@foo.svelte
│ ├ two@foo.svelte
│ └ three.svelte
└ four@foo.svelte
```

#### 継承チェーン(Inheritance chains)

レイアウトは、同じディレクトリまたは親ディレクトリにある名前付きレイアウト(named layouts)を継承するかどうか選択できます。例えば、`x/y/__layout@root.svelte` には名前が付いていないため、`/x/y` のデフォルトのレイアウトです (つまり、`/x/y/one`、`/x/y/two`、`/x/y/three` はどれもこのレイアウトを継承します)。`@root` を指定しているため、もっとも近くにある `__layout-root.svelte` を直接継承することになり、`__layout.svelte` と `x/__layout.svelte` をスキップします。

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

> `__layout-root.svelte` が単独の `<slot />` のみを含んでいる場合、アプリ内のネストレイアウト(nested layout)に `@root` を付けることで、任意のページをブランクレイアウトに 'リセット' することができます。

親が指定されていない場合、レイアウトはツリー上もっとも近くにあるデフォルトのレイアウト(つまり名前が付いていないレイアウト)を継承することになります。名前付きレイアウト(named layout)がツリー上一緒に並んでいるデフォルトのレイアウトを継承するので便利です。例えば、`__layout-root.svelte` は `__layout.svelte` を継承します。明示的に `@default` を指定することで、`/x/y/one` や同じ階層にあるページがアプリのデフォルトのレイアウトを使用するのに `x/__layout.svelte` を使う必要がなくなります:

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

> `default` は予約済の名前です。言い換えると、`__layout-default.svelte` というファイルを使用することはできないということです。

### エラーページ

ページがロード([Loading](/docs/loading)を参照)に失敗した場合、SvelteKitはエラーページ(error page)をレンダリングします。レイアウトやページと一緒に `__error.svelte` コンポーネントを作ることで、このページをカスタマイズすることができます。

例えば、`src/routes/settings/notifications/index.svelte` でロードに失敗した場合、`src/routes/settings/notifications/__error.svelte` が存在すればSveltekitはそれを同じレイアウトでレンダリングします。もし存在しなければ、`src/routes/settings/__error.svelte` を親のレイアウトでレンダリングします。もしそれも存在しなければ、 `src/routes/__error.svelte` をルートレイアウト(root layout) でレンダリングします。

> SvelteKit はデフォルトのエラーページを提供してますが、ご自身で `src/routes/__error.svelte` を用意することを推奨します。

エラーコンポーネントに [`load`](/docs/loading) 関数がある場合、`error` プロパティと `status` プロパティが引数に渡されて呼び出されます。

```html
<script context="module">
	/** @type {import('@sveltejs/kit').Load} */
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

特定のページをレンダリングしているときにエラーが発生した場合のみ、ネストしたエラーページがレンダリングされます。リクエストがどのルートにもマッチしない場合、SvelteKitは代わりに一般的な 404 をレンダリングします。例えば、このようなルートの場合…

```
src/routes/
├ __error.svelte
├ marx-brothers/
│ ├ __error.svelte
│ ├ chico.svelte
│ ├ harpo.svelte
│ └ groucho.svelte
```

… `/marx-brothers/karl` をリクエストしたとしても `marx-brothers/__error.svelte` ファイルはレンダリングされません。ネストしたエラーページをレンダリングさせるには、`/marx-brothers/*` に対するどんなリクエストにもマッチするようなルート(route)を作成し、そこから 404 を返すようにしてください:

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
