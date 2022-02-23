---
title: Types
---

### @sveltejs/kit

SvelteKit の API は全て完全に型付けされています。下記の型は `@sveltejs/kit` からインポートできます:

**TYPES**

### The `App` namespace

`App` namespace を宣言することで、アプリ内のオブジェクトに型を付ける方法を SvelteKit に伝えることができます。デフォルトでは、新しいプロジェクトには `src/app.d.ts` というファイルがあり、下記が含まれています:

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

#### App.Locals

[hooks](/docs/hooks) (`handle`、`handleError`、`getSession`) と [エンドポイント(endpoints)](/docs/routing#endpoints) からアクセスされる `event.locals` を定義する interface です。

#### App.Platform

adapter が `event.platform` を通して [プラットフォーム固有の context](/docs/adapters#supported-environments-platform-specific-context) を提供する場合、ここでそれを指定します。

#### App.Session

`session` を定義する interface です。[`load`](/docs/loading) 関数の引数として、かつ [session store](/docs/modules#$app-stores) の値として定義します。

#### App.Stuff

`stuff` を定義する interface です。[`load`](/docs/loading) のインプットもしくはアウトプットとして、または [page store](/docs/modules#$app-stores) の `stuff` プロパティの値として定義します。
