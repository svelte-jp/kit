---
title: State management
---

クライアントオンリーなアプリを構築するのに慣れている場合、サーバーとクライアントにまたがった state management(状態管理) について怖く感じるかもしれません。このセクションでは、よくある落とし穴を回避するためのヒントを提供します。

## サーバーでは state の共有を避ける <!--avoid-shared-state-on-the-server-->

ブラウザは state を保持します(Browsers are _stateful_) — ユーザーがアプリケーションとやりとりする際に、state はメモリ内に保存されます。一方、サーバーは state を保持しません(Servers are _stateless_) — レスポンスの内容は、完全にリクエストの内容によって決定されます。

概念としては、そうです。現実では、サーバーは長い期間存在し、複数のユーザーで共有されることが多いです。そのため、共有される変数にデータを保存しないことが重要です。例えば、こちらのコードを考えてみます:

```js
// @errors: 7034 7005
/// file: +page.server.js
let user;

/** @type {import('./$types').PageServerLoad} */
export function load() {
	return { user };
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		// NEVER DO THIS!
		user = {
			name: data.get('name'),
			embarrassingSecret: data.get('secret')
		};
	}
}
```

この `user` 変数はサーバーに接続する全員に共有されます。もしアリスが恥ずかしい秘密を送信し、ボブがアリスのあとにページにアクセスした場合、ボブはアリスの秘密を知ることになります (訳注: アリスやボブについては[こちら](https://ja.wikipedia.org/wiki/%E3%82%A2%E3%83%AA%E3%82%B9%E3%81%A8%E3%83%9C%E3%83%96))。さらに付け加えると、アリスが後でサイトに戻ってきたとき、サーバーは再起動していて彼女のデータは失われているかもしれません。

代わりに、[`cookies`](load#cookies) を使用してユーザーを _認証_ し、データベースにデータを保存すると良いでしょう。

## load に副作用を持たせない <!--no-side-effects-in-load-->

同じ理由で、`load` 関数は _純粋(pure)_ であるべきです — 副作用(side-effect)を持つべきではありません (必要なときに使用する `console.log(...)` は除く)。例えば、コンポーネントで store の値を使用できるようにするために、`load` 関数の内側で store に書き込みをしたくなるかもしれません:

```js
/// file: +page.js
// @filename: ambient.d.ts
declare module '$lib/user' {
	export const user: { set: (value: any) => void };
}

// @filename: index.js
// ---cut---
import { user } from '$lib/user';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
	const response = await fetch('/api/user');

	// NEVER DO THIS!
	user.set(await response.json());
}
```

前の例と同様に、これはあるユーザーの情報を _すべての_ ユーザーに共有される場所に置くことになります。代わりに、ただデータを返すようにしましょう…

```diff
/// file: +page.js
export async function load({ fetch }) {
	const response = await fetch('/api/user');

+	return {
+		user: await response.json()
+	};
}
```

…そしてそのデータを必要とするコンポーネントに渡すか、[`$page.data`](load#$page-data) を使用してください。

SSR を使用していない場合は、あるユーザーのデータを別の人に誤って公開してしまうリスクはありません。しかし、それでも `load` 関数の中で副作用を持つべきではありません — 副作用がなければ、あなたのアプリケーションはより理解がしやすいものになります。

## context と共に store を使う <!--using-stores-with-context-->

独自の store が使用できないのであれば、どうやって `$page.data` や他の [app stores](modules#$app-stores) を使用できるようにしているのだろう、と思うかもしれません。その答えは、サーバーの app stores は Svelte の [context API](https://learn.svelte.jp/tutorial/context-api) を使用しているから、です — store は `setContext` でコンポーネントツリーにアタッチされ、subscribe するときは `getContext` で取得します。同じことを独自の store でも行うことができます:

```svelte
<!--- file: src/routes/+layout.svelte --->
<script>
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	/** @type {import('./$types').LayoutData} */
	export let data;

	// store を作成し必要に応じて更新します...
	const user = writable();
	$: user.set(data.user);

	// ...そして子コンポーネントがアクセスできるように context に追加します
	setContext('user', user);
</script>
```

```svelte
<!--- file: src/routes/user/+page.svelte --->
<script>
	import { getContext } from 'svelte';

	// context から user store を取得します
	const user = getContext('user');
</script>

<p>Welcome {$user.name}</p>
```

SSR でページがレンダリングされる場合、階層が深いページやコンポーネントで context ベースの store の値が更新されても、その親のコンポーネントの値には影響しません。更新されるときにはすでにレンダリング済みだからです。それとは対照的に、クライアントでは (CSR が有効な場合、これがデフォルトです)、値は伝搬し、階層の上位にあるコンポーネントやページ、レイアウトに値が反映されます。従って、ハイドレーション中の state の更新による値の 'ちらつき(flashing)' を避けるため、通常は state を上から下にコンポーネントに渡すことを推奨します。

SSR を使用していない場合 (そして将来的にも SSR を使用する必要がないという保証がある場合) は、context API を使用しなくても、共有されるモジュールの中で state を安全に保持することができます。

## コンポーネントとページの state は保持される <!--component-and-page-state-is-preserved-->

アプリケーションの中を移動するとき、SvelteKit はすでに存在するレイアウトやページコンポーネントを再利用します。例えば、このようなルート(route)があるとして…

```svelte
<!--- file: src/routes/blog/[slug]/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;

	// THIS CODE IS BUGGY!
	const wordCount = data.content.split(' ').length;
	const estimatedReadingTime = wordCount / 250;
</script>

<header>
	<h1>{data.title}</h1>
	<p>Reading time: {Math.round(estimatedReadingTime)} minutes</p>
</header>

<div>{@html data.content}</div>
```

…`/blog/my-short-post` から `/blog/my-long-post` への移動は、レイアウトやページ、コンポーネントの破棄や再作成を引き起こしません。代わりに、この `data` prop (と `data.title` と `data.content`) は更新されますが (他の Svelte コンポーネントも同様に)、コードは再実行されないため、`onMount` や `onDestroy` のようなライフサイクルメソッドは再実行されず、`estimatedReadingTime` も再計算されません。

代わりに、その値を [_リアクティブ_](https://learn.svelte.jp/tutorial/reactive-assignments) にする必要があります:

```diff
/// file: src/routes/blog/[slug]/+page.svelte
<script>
	/** @type {import('./$types').PageData} */
	export let data;

+	$: wordCount = data.content.split(' ').length;
+	$: estimatedReadingTime = wordCount / 250;
</script>
```

> `onMount` や `onDestroy` にあるコードをナビゲーションのあとに再実行する必要がある場合は、[afterNavigate](modules#$app-navigation-afternavigate) や [beforeNavigate](modules#$app-navigation-beforenavigate) をそれぞれ使用します。

このようにコンポーネントを再利用すると、サイドバースクロールの state などが保持され、変化する値の間で簡単にアニメーションを行うことができます。ナビゲーション時にコンポーネントを完全に破棄して再マウントする必要がある場合には、このパターンを使用できます:

```svelte
{#key $page.url.pathname}
	<BlogPost title={data.title} content={data.title} />
{/key}
```

## state を URL に保存する <!--storing-state-in-the-url-->

もし、テーブルのフィルターやソートルールなどのように、リロード後も保持されるべき state、または SSR に影響を与える state がある場合、URL search パラメータ (例: `?sort=price&order=ascending`) はこれらを置くのに適した場所です。これらは `<a href="...">` や `<form action="...">` の属性に置いたり、`goto('?key=value')` を使用してプログラム的に設定することもできます。`load` 関数の中では `url` パラメータを使用してアクセスでき、コンポーネントの中では `$page.url.searchParams` でアクセスできます。

## 一時的な state は snapshots に保存する <!--storing-ephemeral-state-in-snapshots-->

'アコーディオンは開いているか？' などの一部の UI の state は一時的なものですぐに捨てられます — ユーザーがページを移動したり更新したりして、その state が失われたとしてもそれほど問題ではありません。ユーザーが別のページに移動して戻ってきたときにデータを保持しておきたい場合もありますが、そのような state を URL や database に保存するのは行き過ぎでしょう。そういった場合のために、SvelteKit [snapshots](snapshots) を提供しています。これによってコンポーネントの state を履歴エントリーに関連付けることができます。
