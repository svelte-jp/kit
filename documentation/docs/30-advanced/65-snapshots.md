---
title: Snapshots
---

例えばサイドバーのスクロールポジションや、`<input>` 要素の中身などの、一時的な DOM の状態(state)は、あるページから別のページに移動するときに破棄されます。

例えば、ユーザーがフォームに入力し、それを送信する前にリンクをクリックして、それからブラウザの戻るボタンを押した場合、フォームに入力されていた値は失われます。入力内容を保持しておくことが重要な場合、DOM の状態を _スナップショット(snapshot)_ として記録することができ、ユーザーが戻ってきたときに復元することができます。

これを行うには、`+page.svelte` や `+layout.svelte` で、`capture` メソッドと `restore` メソッドを持つ `snapshot` オブジェクトをエクスポートします:

```svelte
<!--- file: +page.svelte --->
<script>
	let comment = '';

	/** @type {import('./$types').Snapshot<string>} */
	export const snapshot = {
		capture: () => comment,
		restore: (value) => comment = value
	};
</script>

<form method="POST">
	<label for="comment">Comment</label>
	<textarea id="comment" bind:value={comment} />
	<button>Post comment</button>
</form>
```

このページから離れるとき、ページが更新される直前に `capture` 関数が呼ばれ、戻り値がブラウザの history スタックの現在のエントリーに関連付けられます。もしこのページに戻ってきた場合、ページが更新されるとすぐに保存された値とともに `restore` 関数が呼ばれます。

データは `sessionStorage` に永続化できるように、JSON としてシリアライズ可能でなければなりません。これにより、ページがリロードされたときや、ユーザーが別のサイトから戻ってきたときにも、状態を復元することができます。

> 大きすぎるオブジェクトを `capture` から返さないようにしてください。一度 capture されたオブジェクトは、そのセッションの間はメモリ上に保持されるので、極端な場合には、大きすぎて `sessionStorage` に永続化できない可能性があります。
