---
title: Link options
---

SvelteKit では、アプリのルート(routes)間の移動に、(フレームワーク固有の `<Link>` コンポーネントではなく) `<a>` 要素を使用します。ユーザーが、`href` がアプリのものであるリンク (外部サイトではないリンク) をクリックする場合、SvelteKit はそのコードをインポートし、データを取得するために必要な `load` 関数を呼び出して、新しいページに移動します。

`data-sveltekit-*` 属性でリンクの挙動をカスタマイズすることができます。これらは `<a>` 自身やその親要素に適用することができます。

これらのオプションは、[`method="GET"`](form-actions#get-vs-post) を持つ `<form>` 要素にも適用されます。

## data-sveltekit-preload-data

ユーザーがリンクをクリックしたことをブラウザが検知するより前に、(デスクトップでは) マウスがリンクをホバーしたことや、`touchstart` や `mousedown` がトリガーされることを検知することができます。どちらの場合も、`click` イベントが発生することを経験に基づいて推測することができます。

SvelteKit はこの情報を使ってインポートするコードやそのページのデータの取得をいち早く開始することができ、数百ミリ秒を稼ぐことができます。これが、ユーザーインターフェースが遅延していると感じるか、それともきびきび動いていると感じるかの差になります。

この動作は `data-sveltekit-preload-data` 属性によってコントロールすることができ、2つの値のうちどちらかを設定することができます:

- `"hover"` は、マウスがリンクの上にきたときにプリロードを開始します。モバイルでは、`touchstart` でプリロードが開始されます
- `"tap"` は、`touchstart` や `mousedown` イベントが検知されるとすぐにプリロードが開始されます

デフォルトのプロジェクテンプレートには、`src/app.html` の `<body>` 要素に `data-sveltekit-preload-data="hover"` が適用されており、デフォルトで全てのリンクがホバー時にプリロードされます:

```html
<body data-sveltekit-preload-data="hover">
	<div style="display: contents">%sveltekit.body%</div>
</body>
```

時には、ユーザーがリンクをホバーしたときに `load` を呼ぶのは望ましくないことがあるでしょう。誤検出の可能性もありますし (必ずしもホバーに続いてクリックが発生するわけではない)、データの更新が非常に早い場合はデータが古くなってしまうこともあります。

これらの場合には、値に `"tap"` を指定します。こうすると SvelteKit は、ユーザーがリンクをタップまたはクリックしたときのみ、`load` を呼び出すようになります:

```html
<a data-sveltekit-preload-data="tap" href="/stonks">
	Get current stonk values
</a>
```

> プログラムで `$app/navigation` の `preloadData` を実行することもできます。

ユーザーがデータ使用量の削減を選択している場合、つまり [`navigator.connection.saveData`](https://developer.mozilla.org/ja/docs/Web/API/NetworkInformation/saveData) が `true` になっている場合は、データは決してプリロードされません。

## data-sveltekit-preload-code

リンク先の _データ_ をプリロードしたくない場所であっても、_コード_ をプリロードするのは有益なこともあります。`data-sveltekit-preload-code` 属性は `data-sveltekit-preload-data` と同様に動作しますが、4つの値から選択できる点が異なります。'先行度'('eagerness') の降順で並べると:

- `"eager"` は、すぐにリンクをプリロードします
- `"viewport"` は、リンクがビューポートに入るとすぐにプリロードします
- `"hover"` - コードだけがプリロードされることを除き、上記(`data-sveltekit-preload-data` の `"hover"`)と同じです
- `"tap"` - コードだけがプリロードされることを除き、上記(`data-sveltekit-preload-data` の `"tap"`)と同じです

`viewport` と `eager` は、ナビゲーション直後の DOM に存在するリンクにのみ適用されることにご注意ください。リンクが後から追加された場合 (例えば `{#if ...}` ブロックの中)、`hover` や `tap` によってトリガーされるまでプリロードされません。DOM の変更を積極的に観察することによって生じてしまうパフォーマンス劣化を避けるためです。

> コードのプリロードはデータのプリロードの前提条件であるため、この属性は、存在するどの `data-sveltekit-preload-data` 属性よりも先行度が高い値(more eager value)を指定した場合にのみ、効果を発揮します。

`data-sveltekit-preload-data` と同様、ユーザーがデータ使用量の削減を選択している場合、この属性も無視されます。

## data-sveltekit-reload

時には、SvelteKit にリンクを処理させないで、ブラウザに処理をさせる必要があります。`data-sveltekit-reload` 属性をリンクに追加すると…

```html
<a data-sveltekit-reload href="/path">Path</a>
```

…リンクがクリックされたときにフルページナビゲーションが発生します。

`rel="external"` 属性があるリンクも同様に扱われます。加えて、[プリレンダリング中](page-options#prerender) は無視されます。

## data-sveltekit-replacestate

ナビゲーションするときにブラウザのセッション履歴(session history)に新しいエントリを作成したくない場合があります。リンクに `data-sveltekit-replacestate` 属性を追加すると…

```html
<a data-sveltekit-replacestate href="/path">Path</a>
```

…リンクがクリックされたときに、`pushState` で新しいエントリを作成する代わりに現在の `history` エントリを置き換えます。

## data-sveltekit-keepfocus

ナビゲーションの後に[フォーカスをリセット](accessibility#focus-management)したくない場合があります。例えば、ユーザーが入力している途中で送信をするような検索フォームがあり、テキストの input にフォーカスを維持したい場合です。`data-sveltekit-keepfocus` 属性を追加すると…

```html
<form data-sveltekit-keepfocus>
	<input type="text" name="query">
</form>
```

…ナビゲーション後も現在フォーカスされている要素にフォーカスが維持されるようになります。通常、リンクにこの属性を使用するのは避けてください、フォーカスされる要素が (その前にフォーカスされていた要素ではなく) `<a>` タグになってしまい、スクリーンリーダーなどの支援技術を使用するユーザーはナビゲーションの後にフォーカスが移動することを期待することが多いです。また、この属性はナビゲーションの後にもまだ存在する要素にのみ使用する必要があります。もしその要素が消えてしまうと、ユーザーのフォーカスは失われてしまい、支援技術ユーザーにとって混乱した体験となってしまいます。

## data-sveltekit-noscroll

内部のリンクに移動するとき、SvelteKit はブラウザのデフォルトのナビゲーションの挙動を模倣します: ユーザーがページの左上に来るように、スクロールポジションを `0,0` に変更します (リンクに `#hash` が含まれている場合は、ID が一致する要素までスクロールします)。

特定のケースでは、この挙動を無効化したいことがあるでしょう。`data-sveltekit-noscroll` 属性をリンクに追加すると…

```html
<a href="path" data-sveltekit-noscroll>Path</a>
```

…リンクがクリックされたあとのスクロールを中止します。

## Disabling options

これらのオプションが有効になっている要素の中でこれらのオプションを無効にするには、`"false"` 値を使用します:

```html
<div data-sveltekit-preload-data>
	<!-- these links will be preloaded -->
	<a href="/a">a</a>
	<a href="/b">b</a>
	<a href="/c">c</a>

	<div data-sveltekit-preload-data="false">
		<!-- these links will NOT be preloaded -->
		<a href="/d">d</a>
		<a href="/e">e</a>
		<a href="/f">f</a>
	</div>
</div>
```

条件によって要素に属性を適用する場合は、このようにします:

```svelte
<div data-sveltekit-preload-data={condition ? 'hover' : false}>
```
