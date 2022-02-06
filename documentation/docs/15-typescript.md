---
title: TypeScript
---

SvelteKit の全ての API は完全に型付けされています。さらに、`App` namespace を宣言することで、アプリ内のオブジェクトに型を付ける方法を SvelteKit に伝えることができます。デフォルトでは、新しいプロジェクトには以下の内容を含む `src/app.d.ts` というファイルがあります:

```ts
/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {}

	interface Platform {}

	interface Session {}

	interface Stuff {}
}
```

これらの interface を作成することで、`event.locals`、`event.platform`、`session`、`stuff` を使用する際に型の安全性を確保することができます。

### App.Locals

[hooks](#hooks) (`handle`、`handleError`、`getSession`) と [エンドポイント(endpoints)](#routing-endpoints) からアクセスされる `event.locals` を定義する interface です。

### App.Platform

adapter が `event.platform` を通して [プラットフォーム固有の context](#adapters-supported-environments-platform-specific-context) を提供する場合、ここでそれを指定します。

### App.Session

`session` を定義する interface です。[`load`](#loading) 関数の引数として、かつ [session store](#modules-$app-stores) の値として定義します。

### App.Stuff

`stuff` を定義する interface です。[`load`](#loading) のインプットもしくはアウトプットとして、または [page store](#modules-$app-stores) の `stuff` プロパティの値として定義します。
