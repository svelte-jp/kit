---
title: Form actions
---

`+page.server.js` ファイルは _actions_ をエクスポートできます。これによって、`<form>` 要素を使用することでサーバーにデータを `POST` することができます。

`<form>` を使用する場合、クライアントサイドの JavaScript はオプションですが、JavaScript によって form のインタラクションを簡単にプログレッシブに強化(_progressively enhance_)することができ、最高のユーザーエクスペリエンスを提供することができます。

## Default actions

最もシンプルなケースでは、ページは `default` の action を宣言します:

```js
/// file: src/routes/login/+page.server.js
/** @type {import('./$types').Actions} */
export const actions = {
	default: async (event) => {
		// TODO log the user in
	}
};
```

`/login` ページからこの action を呼び出すには、`<form>` を追加します。JavaScript は必要ありません:

```svelte
<!--- file: src/routes/login/+page.svelte --->
<form method="POST">
	<label>
		Email
		<input name="email" type="email">
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
</form>
```

もし誰かがボタンをクリックしたら、ブラウザは form のデータを `POST` リクエストでサーバーに送信し、デフォルトの action が実行されます。

> Action は常に `POST` リクエストを使用します。`GET` リクエストには決して副作用があってはならないからです。

また、`action` 属性を追加し、リクエスト先のページを指し示すことで、他のページから action を呼び出すこともできます (例えば、最上位のレイアウト(root layout)にある nav にログイン用の widget がある場合):

```html
/// file: src/routes/+layout.svelte
<form method="POST" action="/login">
	<!-- content -->
</form>
```

## Named actions

単一の `default` の action の代わりに、名前付きの action (named action) を必要なだけ持つことができます:

```diff
/// file: src/routes/login/+page.server.js
/** @type {import('./$types').Actions} */
export const actions = {
-	default: async (event) => {
+	login: async (event) => {
		// TODO log the user in
	},
+	register: async (event) => {
+		// TODO register the user
+	}
};
```

名前付きの action (named action) を呼び出すには、クエリパラメータに `/` を接頭辞に付与したその action の名前を追加します:

```svelte
<!--- file: src/routes/login/+page.svelte --->
<form method="POST" action="?/register">
```

```svelte
<!--- file: src/routes/+layout.svelte --->
<form method="POST" action="/login?/register">
```

`action` 属性と同じように、button の `formaction` 属性を使用することができ、こうすると親の `<form>` とは別の action に同じ form のデータを `POST` することができます:

```diff
/// file: src/routes/login/+page.svelte
-<form method="POST">
+<form method="POST" action="?/login">
	<label>
		Email
		<input name="email" type="email">
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
+	<button formaction="?/register">Register</button>
</form>
```

> 名前付き action (named action) の隣にデフォルトの action を置くことはできません。なぜなら リダイレクト無しで名前付き action (named action) に POST をすると、クエリパラメータが URL に保持され、それ以降デフォルトの POST をしようとしても以前 POST した名前付き action (named action) を通ってしまうからです。

## action の解剖学 <!--anatomy-of-an-action-->

action はそれぞれ `RequestEvent` オブジェクトを受け取って、`request.formData()` でデータを読み込むことができます。リクエスト (例えば、cookie をセットしてユーザーをログインさせるなど) を処理したあと、action は次の更新まで、対応するページでは `form` プロパティで、アプリ全体では `$page.form` で利用可能なデータで応答することができます。

```js
// @errors: 2304
/// file: src/routes/login/+page.server.js
/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies }) {
	const user = await db.getUserFromSession(cookies.get('sessionid'));
	return { user };
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		cookies.set('sessionid', await db.createSession(user));

		return { success: true };
	},
	register: async (event) => {
		// TODO register the user
	}
};
```

```svelte
<!--- file: src/routes/login/+page.svelte --->
<script>
	/** @type {import('./$types').PageData} */
	export let data;

	/** @type {import('./$types').ActionData} */
	export let form;
</script>

{#if form?.success}
	<!-- このメッセージは一時的なものです; form 送信に対するレスポンスとしてページがレンダリングされたため、存在しています。
	       ユーザーがリロードすると消えます。 -->
	<p>Successfully logged in! Welcome back, {data.user.name}</p>
{/if}
```

### Validation errors

無効なデータが原因でリクエストが処理できなかった場合、再試行できるようにするために、直前に送信した form の値とともに validation error をユーザーに返すことができます。`fail` 関数は、HTTP ステータスコード (通常、validation error の場合は 400 か 422) をデータとともに返します。ステータスコードは `$page.status` から使用することができ、data は `form` から使用することができます:

```diff
/// file: src/routes/login/+page.server.js
+import { fail } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

+		if (!email) {
+			return fail(400, { email, missing: true });
+		}

		const user = await db.getUser(email);

+		if (!user || user.password !== hash(password)) {
+			return fail(400, { email, incorrect: true });
+		}

		cookies.set('sessionid', await db.createSession(user));

		return { success: true };
	},
	register: async (event) => {
		// TODO register the user
	}
};
```

> 念のため、password は返さず、email のみをページに返していることにご注意ください。

```diff
/// file: src/routes/login/+page.svelte
<form method="POST" action="?/login">
+	{#if form?.missing}<p class="error">The email field is required</p>{/if}
+	{#if form?.incorrect}<p class="error">Invalid credentials!</p>{/if}
	<label>
		Email
-		<input name="email" type="email">
+		<input name="email" type="email" value={form?.email ?? ''}>
	</label>
	<label>
		Password
		<input name="password" type="password">
	</label>
	<button>Log in</button>
	<button formaction="?/register">Register</button>
</form>
```

戻り値は JSON としてシリアライズ可能でなければなりません。その上で、構造は完全にあなた次第です。例えば、もしページに複数の form がある場合、返された `form` データがどの `<form>` を参照しているかを `id` プロパティなどで区別することができます。

### Redirects

redirect (と error) は [`load`](load#redirects) のそれと同じように機能します:

```diff
/// file: src/routes/login/+page.server.js
+import { fail, redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
+	login: async ({ cookies, request, url }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		if (!user) {
			return fail(400, { email, missing: true });
		}

		if (user.password !== hash(password)) {
			return fail(400, { email, incorrect: true });
		}

		cookies.set('sessionid', await db.createSession(user));

+		if (url.searchParams.has('redirectTo')) {
+			throw redirect(303, url.searchParams.get('redirectTo'));
+		}

		return { success: true };
	},
	register: async (event) => {
		// TODO register the user
	}
};
```

## Loading data

action の実行後、そのページは (リダイレクトや予期せぬエラーが発生しない限り) 再レンダリングされ、action の戻り値が `form` プロパティとしてそのページで使用できるようになります。つまり、ページの `load` 関数は、action が完了したあとに実行されるということです。

`handle` は action が呼び出される前に実行され、`load` 関数より前に再実行されることはないことに注意してください。つまり、例えば `handle` を使用して cookie を元に `event.locals` に値を入れる場合、action で cookie を設定したり削除したりするときは `event.locals` を更新しなければなりません:

```js
/// file: src/hooks.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
		} | null
	}
}

// @filename: global.d.ts
declare global {
	function getUser(sessionid: string | undefined): {
		name: string;
	};
}

export {};

// @filename: index.js
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	event.locals.user = await getUser(event.cookies.get('sessionid'));
	return resolve(event);
}
```

```js
/// file: src/routes/account/+page.server.js
// @filename: ambient.d.ts
declare namespace App {
	interface Locals {
		user: {
			name: string;
		} | null
	}
}

// @filename: index.js
// ---cut---
/** @type {import('./$types').PageServerLoad} */
export function load(event) {
	return {
		user: event.locals.user
	};
}

/** @type {import('./$types').Actions} */
export const actions = {
	logout: async (event) => {
		event.cookies.delete('sessionid');
		event.locals.user = null;
	}
};
```

## Progressive enhancement

前のセクションでは [クライアントサイドの JavaScriptなしで動作する](https://kryogenix.org/code/browser/everyonehasjs.html) `/login` action を構築しました — `fetch` は見当たりません。これは素晴らしいことですが、JavaScript が利用可能な場合は、より良いユーザーエクスペリンスを提供するために form のインタラクションをプログレッシブに強化 (progressively enhance) することができます。

### use:enhance

form をプログレッシブに強化する最も簡単な方法は、`use:enhance` action を追加することです:

```diff
/// file: src/routes/login/+page.svelte
<script>
+	import { enhance } from '$app/forms';

	/** @type {import('./$types').ActionData} */
	export let form;
</script>

+<form method="POST" use:enhance>
```

> ええ、`enhance` action と `<form action>` をどちらも 'action' と呼んでいて、少し紛らわしいですよね。このドキュメントは action でいっぱいです。申し訳ありません。

引数が無い場合、`use:enhance` は、ブラウザネイティブの動作を、フルページリロードを除いてエミュレートします。それは:

- action が送信元のページと同じ場所にある場合に限り、成功レスポンスまたは不正なレスポンスに応じて、`form` プロパティと `$page.form` と `$page.status` を更新します。例えば、`<form action="/somewhere/else" ..>` というようなフォームの場合、`form` と `$page` は更新されません。これは、ネイティブのフォーム送信では action があるページにリダイレクトされるからです。どちらにしても更新させたい場合は、[`applyAction`](#progressive-enhancement-applyaction) を使用してください
- 成功レスポンスの場合は、`<form>` 要素をリセットして `invalidateAll` で全てのデータを無効化・最新化(invalidate)します
- リダイレクトレスポンスの場合は `goto` を呼び出します
- エラーが発生した場合はもっとも近くにある `+error` 境界をレンダリングします
- 適切な要素に [フォーカスをリセット](accessibility#focus-management) します

この挙動をカスタマイズするために、form が送信される直前に実行される `SubmitFunction` 関数を提供することができます。そして (オプションで) `ActionResult` を引数に取るコールバックを返すことができます。もしコールバックを返す場合、上述のデフォルトの動作はトリガーされません。元に戻すには、`update` を呼び出してください。

```svelte
<form
	method="POST"
	use:enhance={({ formElement, formData, action, cancel, submitter }) => {
		// `formElement` はこの `<form>` 要素です
		// `formData` は送信される予定の `FormData` オブジェクトです
		// `action` はフォームが POST される URL です
		// `cancel()` を呼び出すと送信(submission)を中止します
		// `submitter` は、フォームの送信を実行した `HTMLElement` です

		return async ({ result, update }) => {
			// `result` は `ActionResult` オブジェクトです
			// `update` は、このコールバックが設定されていない場合に起動されるデフォルトのロジックを起動する関数です
		};
	}}
>
```

これらの関数を、ロード中の UI (loading UI) を表示したり隠したりすることなどに使用できます。

### applyAction

独自のコールバックを提供する場合は、最も近くにある `+error` 境界を表示するなど、デフォルトの `use:enhance` の一部を再現する必要があるでしょう。ほとんどの場合、コールバックに渡された `update` を呼び出すだけで十分です。もっとカスタマイズが必要な場合は、`applyAction` を使用してそれを行うことができます:

```diff
/// file: src/routes/login/+page.svelte
<script>
+	import { enhance, applyAction } from '$app/forms';

	/** @type {import('./$types').ActionData} */
	export let form;
</script>

<form
	method="POST"
	use:enhance={({ formElement, formData, action, cancel }) => {

		return async ({ result }) => {
			// `result` は `ActionResult` オブジェクトです
+			if (result.type === 'error') {
+				await applyAction(result);
+			}
		};
	}}
>
```

`applyAction(result)` の挙動は `result.type` に依存しています:

- `success`, `failure` — `$page.status` を `result.status` に設定し、`form` と `$page.form` を `result.data` で更新します (`enhance` の `update` とは対照的に、送信元がどこかは関係ありません)
- `redirect` — `goto(result.location)` を呼び出します
- `error` — もっとも近くにある `+error` 境界を `result.error` でレンダリングします

いずれの場合でも、[フォーカスはリセットされます](accessibility#focus-management)。

### Custom event listener

`use:enhance` ではなく、`<form>` の通常のイベントリスナーを使うことで、ご自身でプログレッシブ・エンハンスメント(progressive enhancement)を実装することもできます:

```svelte
<!--- file: src/routes/login/+page.svelte --->
<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction, deserialize } from '$app/forms';

	/** @type {import('./$types').ActionData} */
	export let form;

	/** @type {any} */
	let error;

	async function handleSubmit(event) {
		const data = new FormData(this);

		const response = await fetch(this.action, {
			method: 'POST',
			body: data
		});

		/** @type {import('@sveltejs/kit').ActionResult} */
		const result = deserialize(await response.text());

		if (result.type === 'success') {
			// rerun all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
	}
</script>

<form method="POST" on:submit|preventDefault={handleSubmit}>
	<!-- content -->
</form>
```

処理を進める前に、`$app/forms` の `deserialize` でレスポンスをデシリアライズする必要があることにご注意ください。`JSON.parse()` では不十分です。なぜなら、例えば `load` 関数のような form action は、`Date` や `BigInt` オブジェクトも戻り値としてサポートしているからです。

もし `+page.server.js` と `+server.js` のどちらも存在する場合、デフォルトでは、`fetch` リクエストは `+server.js` のほうにルーティングされます。`+page.server.js` の action に `POST` をするには、カスタムの `x-sveltekit-action` ヘッダーを使用します:

```diff
const response = await fetch(this.action, {
	method: 'POST',
	body: data,
+	headers: {
+		'x-sveltekit-action': 'true'
+	}
});
```

## Alternatives

サーバーにデータを送信する方法として、プログレッシブな強化(progressively enhance)を行うことができるため Form actions は望ましい方法ですが、[`+server.js`](routing#server) ファイルを使用して (例えば) JSON API を公開することもできます。それは例えばこのように行います:

```svelte
<!--- file: send-message/+page.svelte --->
<script>
	function rerun() {
		fetch('/api/ci', {
			method: 'POST'
		});
	}
</script>

<button on:click={rerun}>Rerun CI</button>
```

```js
// @errors: 2355 1360 2322
/// file: api/ci/+server.js

/** @type {import('./$types').RequestHandler} */
export function POST() {
	// do something
}
```

## GET vs POST

これまで見てきたように、フォームアクションを使うには、`method="POST"` を使用する必要があります。

サーバーにデータを `POST` する必要がないフォームもあるでしょう — 例えば検索入力(search inputs)です。これに対応するには `method="GET"` (または、`method` を全く書かないのも同等です) を使うことができ、そして SvelteKit はそれを `<a>` 要素のように扱い、フルページナビゲーションの代わりにクライアントサイドルーターを使用します。:

```html
<form action="/search">
	<label>
		Search
		<input name="q">
	</label>
</form>
```

この form を送信すると `/search?q=...` に移動して load 関数が実行されますが、action は実行されません。`<a>` 要素と同じように、[`data-sveltekit-reload`](link-options#data-sveltekit-reload) 属性、 [`data-sveltekit-replacestate`](link-options#data-sveltekit-replacestate) 属性、[`data-sveltekit-keepfocus`](link-options#data-sveltekit-keepfocus) 属性、 [`data-sveltekit-noscroll`](link-options#data-sveltekit-noscroll) 属性を `<form>` に設定することができ、ルーターの挙動をコントロールすることができます。

## その他の参考資料 <!--further-reading-->

- [Tutorial: Forms](https://learn.svelte.jp/tutorial/the-form-element)
