---
title: Form Actions
---

`+page.server.js` ファイルは _actions_ をエクスポートできます。これによって、`<form>` 要素を使用することでサーバーにデータを `POST` することができます。

`<form>` を使用する場合、クライアントサイドの JavaScript はオプションですが、JavaScript によって form のインタラクションを簡単にプログレッシブに強化(_progressively enhance_)することができ、最高のユーザーエクスペリエンスを提供することができます。

### Default actions

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
/// file: src/routes/login/+page.svelte
<form method="POST">
	<input name="email" type="email">
	<input name="password" type="password">
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

### Named actions

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
/// file: src/routes/login/+page.svelte
<form method="POST" action="?/register">
```

```svelte
/// file: src/routes/+layout.svelte
<form method="POST" action="/login?/register">
```

`action` 属性と同じように、button の `formaction` 属性を使用することができ、こうすると親の `<form>` とは別の action に同じ form のデータを `POST` することができます:

```diff
/// file: src/routes/login/+page.svelte
-<form method="POST">
+<form method="POST" action="?/login">
	<input name="email" type="email">
	<input name="password" type="password">
	<button>Log in</button>
+	<button formaction="?/register">Register</button>
</form>
```

> 名前付き action (named action) の隣にデフォルトの action を置くことはできません。なぜなら リダイレクト無しで名前付き action (named action) に POST をすると、クエリパラメータが URL に保持され、それ以降デフォルトの POST をしようとしても以前 POST した名前付き action (named action) を通ってしまうからです。

### action の解剖学

action はそれぞれ `RequestEvent` オブジェクトを受け取って、`request.formData()` でデータを読み込むことができます。リクエスト (例えば、cookie をセットしてユーザーをログインさせるなど) を処理したあと、action は次の更新まで `form` として利用可能なデータで応答することができます。

```js
// @errors: 2339 2304
/// file: src/routes/login/+page.server.js
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
/// file: src/routes/login/+page.svelte
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

#### Validation errors

無効なデータが原因でリクエストが処理できなかった場合、再試行できるようにするために、直前に送信した form の値とともに validation error をユーザーに返すことができます。`invalid` 関数は、HTTP ステータスコード (通常、validation error の場合は 400) をデータとともに返します:

```diff
// @errors: 2339 2304
/// file: src/routes/login/+page.server.js
+import { invalid } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ cookies, request }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

+		if (!email) {
+			return invalid(400, { email, missing: true });
+		}

		const user = await db.getUser(email);

+		if (!user || user.password !== hash(password)) {
+			return invalid(400, { email, incorrect: true });
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
-	<input name="email" type="email">
+	{#if form?.missing}<p class="error">The email field is required</p>{/if}
+	{#if form?.incorrect}<p class="error">Invalid credentials!</p>{/if}
+	<input name="email" type="email" value={form?.email ?? ''}>

	<input name="password" type="password">
	<button>Log in</button>
	<button formaction="?/register">Register</button>
</form>
```

戻り値は JSON としてシリアライズ可能でなければなりません。その上で、構造は完全にあなた次第です。例えば、もしページに複数の form がある場合、返された `form` データがどの `<form>` を参照しているかを `id` プロパティなどで区別することができます。

#### Redirects

redirect (と error) は [`load`](/docs/load#redirects) のそれと同じように機能します:

```diff
// @errors: 2339 2304
/// file: src/routes/login/+page.server.js
+import { invalid, redirect } from '@sveltejs/kit';

/** @type {import('./$types').Actions} */
export const actions = {
+	login: async ({ cookies, request, url }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');

		const user = await db.getUser(email);
		if (!user) {
			return invalid(400, { email, missing: true });
		}

		if (user.password !== hash(password)) {
			return invalid(400, { email, incorrect: true });
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

### Progressive enhancement

前のセクションでは [クライアントサイドの JavaScriptなしで動作する](https://kryogenix.org/code/browser/everyonehasjs.html) `/login` action を構築しました — `fetch` は見当たりません。これは素晴らしいことですが、JavaScript が利用可能な場合は、より良いユーザーエクスペリンスを提供するために form のインタラクションをプログレッシブに強化 (progressively enhance) することができます。

#### use:enhance

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

- 成功レスポンスの場合は `form` プロパティを更新し、全てのデータを無効化・最新化(invalidate)します
- 無効なレスポンスの場合は `form` プロパティを更新します
- 成功または無効レスポンスの場合は `$page.status` を更新します
- リダイレクトレスポンスの場合は `goto` を呼び出します
- エラーが発生した場合はもっとも近くにある `+error` 境界をレンダリングします

> By default the `form` property is only updated for actions that are in a `+page.server.js` alongside the `+page.svelte` because in the native form submission case you would be redirected to the page the action is on

この挙動をカスタマイズするために、form が送信される直前に実行される関数を提供することができます。そして (オプションで) `ActionResult` を引数に取るコールバックを返すことができます。

```svelte
<form
	method="POST"
	use:enhance={({ form, data, cancel }) => {
		// `form` は `<form>` 要素です
		// `data` はその `FormData` オブジェクトです
		// `cancel()` は送信(submission)を中止します

		return async ({ result }) => {
			// `result` は `ActionResult` オブジェクトです
		};
	}}
>
```

これらの関数を、ロード中の UI (loading UI) を表示したり隠したりすることなどに使用できます。

#### applyAction

独自のコールバックを提供する場合は、最も近くにある `+error` 境界を表示するなど、デフォルトの `use:enhance` の一部を再現する必要があるでしょう。`applyAction` でこれを行うことができます:

```diff
<script>
+	import { enhance, applyAction } from '$app/forms';

	/** @type {import('./$types').ActionData} */
	export let form;
</script>

<form
	method="POST"
	use:enhance={({ form, data, cancel }) => {
		// `form` は `<form>` 要素です
		// `data` はその `FormData` オブジェクトです
		// `cancel()` は送信(submission)を中止します

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

- `success`, `invalid` — `$page.status` を `result.status` に設定し、`form` を `result.data` で更新します
- `redirect` — `goto(result.location)` を呼び出します
- `error` — もっとも近くにある `+error` 境界を `result.error` でレンダリングします

#### Custom event listener

`use:enhance` ではなく、`<form>` の通常のイベントリスナーを使うことで、ご自身でプログレッシブ・エンハンスメント(progressive enhancement)を実装することもできます:

```svelte
/// file: src/routes/login/+page.svelte
<script>
	import { invalidateAll, goto } from '$app/navigation';
	import { applyAction } from '$app/forms';

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
		const result = await response.json();

		if (result.type === 'success') {
			// re-run all `load` functions, following the successful update
			await invalidateAll();
		}

		applyAction(result);
	}
</script>

<form method="POST" on:submit|preventDefault={handleSubmit}>
	<!-- content -->
</form>
```

### Alternatives

Form actions are the preferred way to send data to the server, since they can be progressively enhanced, but you can also use [`+server.js`](/docs/routing#server) files to expose (for example) a JSON API.