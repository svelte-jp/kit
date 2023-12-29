---
title: Errors
---

ソフトウェア開発において、エラーは避けられないものです。SvelteKit では、エラーが発生した場所、エラーの種類、受信したリクエストの性質に応じて、異なる方法でエラーを処理します。

## Error objects

SvelteKit は想定されるエラーと予期せぬエラーを区別します。どちらもデフォルトではシンプルな `{ message: string }` オブジェクトとして表現されます。

以下の例のように、`code` やトラッキング `id` を追加することができます。(TypeScript を使用する場合、[Type safety](errors#type-safety) で説明したように `Error` 型を再定義する必要があります)

## Expected errors

想定されるエラーとは、`@sveltejs/kit` からインポートされる [`error`](modules#sveltejs-kit-error) を使用して作成されるものを指します:

```js
/// file: src/routes/blog/[slug]/+page.server.js
// @filename: ambient.d.ts
declare module '$lib/server/database' {
	export function getPost(slug: string): Promise<{ title: string, content: string } | undefined>
}

// @filename: index.js
// ---cut---
import { error } from '@sveltejs/kit';
import * as db from '$lib/server/database';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	const post = await db.getPost(params.slug);

	if (!post) {
		error(404, {
			message: 'Not found'
		});
	}

	return { post };
}
```

これは SvelteKit が catch する例外をスローし、それによってレスポンスのステータスコードを 404 に設定し、[`+error.svelte`](routing#error) コンポーネントをレンダリングします。`$page.error` は `error(...)` に第二引数として渡されたオブジェクトです。

```svelte
<!--- file: src/routes/+error.svelte --->
<script>
	import { page } from '$app/stores';
</script>

<h1>{$page.error.message}</h1>
```

必要に応じて、エラーオブジェクトにプロパティを追加することができます…

```diff
error(404, {
	message: 'Not found',
+	code: 'NOT_FOUND'
});
```

…追加しない場合は、便宜上、文字列を第二引数に渡すことができます:

```diff
-error(404, { message: 'Not found' });
+error(404, 'Not found');
```

> [SvelteKit 1.x 系では](migrating-to-sveltekit-2#redirect-and-error-are-no-longer-thrown-by-you)、ご自身で `error` を `throw` しなければいけませんでした。

## Unexpected errors

予期せぬエラーとは、リクエストの処理中に発生するその他の例外のことを指します。これらは機密情報を含むことがあるため、予期せぬエラーのメッセージとスタックトレースはユーザーには公開されません。

デフォルトでは、予期せぬエラーはコンソール (または、本番環境では、サーバーログ) に出力され、ユーザーに公開されるエラーはこのように汎用的な形式です。

```json
{ "message": "Internal Error" }
```

予期せぬエラーは [`handleError`](hooks#shared-hooks-handleerror) hook を通ります。ここで、独自のエラーハンドリングを追加することができます。例えば、レポーティングサービスにエラーを送ったり、カスタムのエラーオブジェクト (これは `$page.error` になります) を返したりすることができます。

## Responses

もし `handle` の中や [`+server.js`](routing#server) リクエストハンドラの中でエラーが発生した場合、SvelteKit はリクエストの `Accept` ヘッダー に応じて、フォールバックエラーページか、エラーオブジェクトの JSON 表現をレスポンスとして返します。

`src/error.html` ファイルを追加することで、フォールバックエラーページをカスタマイズすることができます:

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>%sveltekit.error.message%</title>
	</head>
	<body>
		<h1>My custom error page</h1>
		<p>Status: %sveltekit.status%</p>
		<p>Message: %sveltekit.error.message%</p>
	</body>
</html>
```

SvelteKit が `%sveltekit.status%` と `%sveltekit.error.message%` を、それぞれ対応する値に置き換えます。

ページのレンダリング中に `load` 関数の中でエラーが発生した場合、SvelteKit はエラーが発生した場所に最も近い [`+error.svelte`](routing#error) コンポーネントをレンダリングします。`+layout(.server).js` の `load` 関数の内側でエラーが発生した場合、ツリーの中で最も近くにあるエラー境界はそのレイアウトの上位にある `+error.svelte` ファイルです (隣ではありません)。

例外は、最上位の `+layout.js` や `+layout.server.js` の中でエラーが発生した場合です。通常、最上位のレイアウトには `+error.svelte` コンポーネントが含まれているためです。この場合、SvelteKit はフォールバックエラーページを使用します。

## Type safety

もし TypeScript を使用していてエラーの形式をカスタマイズする必要がある場合、アプリで `App.Error` インターフェイスを宣言することでそれができます (慣習ではこれを `src/app.d.ts` に書きますが、TypeScript が '参照' することができればどこでも構いません):

```diff
/// file: src/app.d.ts
declare global {
	namespace App {
		interface Error {
+			code: string;
+			id: string;
		}
	}
}

export {};
```

このインターフェイスは常に `message: string` プロパティを含んでいます。

## その他の参考資料

- [Tutorial: Errors and redirects](https://learn.svelte.jp/tutorial/error-basics)
- [Tutorial: Hooks](https://learn.svelte.jp/tutorial/handle)
