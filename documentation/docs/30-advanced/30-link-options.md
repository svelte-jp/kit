---
title: Link options
---

SvelteKit では、アプリのルート(routes)間の移動に、(フレームワーク固有の `<Link>` コンポーネントではなく) `<a>` 要素を使用します。ユーザーが、`href` がアプリのものであるリンク (外部サイトではないリンク) をクリックする場合、SvelteKit はそのコードをインポートし、データを取得するために必要な `load` 関数を呼び出して、新しいページに移動します。

`data-sveltekit-*` 属性でリンクの挙動をカスタマイズすることができます。これらは `<a>` 自身やその親要素に適用することができます。

### data-sveltekit-prefetch

コードのインポートとページのデータの取得を先取りするためには、`data-sveltekit-prefetch` 属性を使用します。これによって、ナビゲーションをトリガーする `click` イベントを待つのではなく、ユーザーがリンクをホバーしたり(デスクトップの場合)、タッチしたり(モバイルの場合)するとすぐにすべての読み込みを開始します。通常、これによって数百ミリ秒稼ぐことができ、この差は遅延を感じるインターフェースときびきび動くインターフェースの違いとなります。

この挙動を全体に適用するには、この属性を親要素 (または `src/app.html` の `<body>`) に追加してください:

```html
/// file: src/routes/+layout.svelte
<main data-sveltekit-prefetch>
	<slot />
</main>
```

> また、プログラムで `$app/navigation` の `prefetch` を呼び出すこともできます。 

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
<div data-sveltekit-prefetch>
	<!-- これらのリンクはプリフェッチされます -->
	<a href="/a">a</a>
	<a href="/b">b</a>
	<a href="/c">c</a>

	<div data-sveltekit-prefetch="off">
		<!-- これらのリンクはプリフェッチされません -->
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
