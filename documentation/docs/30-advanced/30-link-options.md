---
title: Link options
---

SvelteKit では、アプリのルート(routes)間の移動に、(フレームワーク固有の `<Link>` コンポーネントではなく) `<a>` 要素を使用します。ユーザーが、`href` がアプリのものであるリンク (外部サイトではないリンク) をクリックする場合、SvelteKit はそのコードをインポートし、データを取得するために必要な `load` 関数を呼び出して、新しいページに移動します。

`data-sveltekit-*` 属性でリンクの挙動をカスタマイズすることができます。これらは `<a>` 自身やその親要素に適用することができます。

### data-sveltekit-preload-data

Before the browser registers that the user has clicked on a link, we can detect that they've hovered the mouse over it (on desktop) or that a `touchstart` or `mousedown` event was triggered. In both cases, we can make an educated guess that a `click` event is coming.

SvelteKit can use this information to get a head start on importing the code and fetching the page's data, which can give us an extra couple of hundred milliseconds — the difference between a user interface that feels laggy and one that feels snappy.

We can control this behaviour with the `data-sveltekit-preload-data` attribute, which can have one of two values:

- `"hover"` means that preloading will start if the mouse comes to a rest over a link. On mobile, preloading begins on `touchstart`
- `"tap"` means that preloading will start as soon as a `touchstart` or `mousedown` event is registered

The default project template has a `data-sveltekit-preload-data="hover"` attribute applied to the `<body>` element in `src/app.html`, meaning that every link is preloaded on hover by default:

```html
<body data-sveltekit-preload-data="hover">
	<div style="display: contents">%sveltekit.body%</div>
</body>
```

Sometimes, calling `load` when the user hovers over a link might be undesirable, either because it's likely to result in false positives (a click needn't follow a hover) or because data is updating very quickly and a delay could mean staleness.

In these cases, you can specify the `"tap"` value, which causes SvelteKit to call `load` only when the user taps or clicks on a link:

```html
<a data-sveltekit-preload-data="tap" href="/stonks">
	Get current stonk values
</a>
```

> You can also programmatically invoke `preloadData` from `$app/navigation`.

Data will never be preloaded if the user has chosen reduced data usage, meaning [`navigator.connection.saveData`](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData) is `true`.

### data-sveltekit-preload-code

Even in cases where you don't want to preload _data_ for a link, it can be beneficial to preload the _code_. The `data-sveltekit-preload-code` attribute works similarly to `data-sveltekit-preload-data`, except that it can take one of four values, in decreasing 'eagerness':

- `"eager"` means that links will be preloaded straight away
- `"viewport"` means that links will be preloaded once they enter the viewport
- `"hover"` - as above, except that only code is preloaded
- `"tap"` - as above, except that only code is preloaded

Note that `viewport` and `eager` only apply to links that are present in the DOM immediately following navigation — if a link is added later (in an `{#if ...}` block, for example) it will not be preloaded until triggered by `hover` or `tap`. This is to avoid performance pitfalls resulting from aggressively observing the DOM for changes.

> Since preloading code is a prerequisite for preloading data, this attribute will only have an effect if it specifies a more eager value than any `data-sveltekit-preload-data` attribute that is present.

As with `data-sveltekit-preload-data`, this attribute will be ignored if the user has chosen reduced data usage.

### data-sveltekit-reload

時には、SvelteKit にリンクを処理させないで、ブラウザに処理をさせる必要があります。`data-sveltekit-reload` 属性をリンクに追加すると…

```html
<a data-sveltekit-reload href="/path">Path</a>
```

…リンクがクリックされたときにフルページナビゲーションが発生します。

`rel="external"` 属性があるリンクも同様に扱われます。加えて、[プリレンダリング中](/docs/page-options#prerender) は無視されます。

### data-sveltekit-noscroll

内部のリンクに移動するとき、SvelteKit はブラウザのデフォルトのナビゲーションの挙動を模倣します: ユーザーがページの左上に来るように、スクロールポジションを 0,0 に変更します (リンクに `#hash` が含まれている場合は、ID が一致する要素までスクロールします)。

特定のケースでは、この挙動を無効化したいことがあるでしょう。`data-sveltekit-noscroll` 属性をリンクに追加すると…

```html
<a href="path" data-sveltekit-noscroll>Path</a>
```

…リンクがクリックされたあとのスクロールを中止します。

### Disabling options

これらのオプションが有効になっている要素の中でこれらのオプションを無効にするには、`"off"` 値を使用します:

```html
<div data-sveltekit-preload-data>
	<!-- these links will be preloaded -->
	<a href="/a">a</a>
	<a href="/b">b</a>
	<a href="/c">c</a>

	<div data-sveltekit-preload-data="off">
		<!-- these links will NOT be preloaded -->
		<a href="/d">d</a>
		<a href="/e">e</a>
		<a href="/f">f</a>
	</div>
</div>
```

条件によって要素に属性を適用する場合は、このようにします:

```html
<div data-sveltekit-reload={shouldReload ? '' : 'off'}>
```

> HTML では `<element attribute>` と `<element attribute="">` が同等であるため、これがうまく動作します
