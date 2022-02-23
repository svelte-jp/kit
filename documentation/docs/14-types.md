---
title: Types
---

### @sveltejs/kit

All APIs in SvelteKit are fully typed. The following types can be imported from `@sveltejs/kit`:

**TYPES**

### The `App` namespace

It's possible to tell SvelteKit how to type objects inside your app by declaring the `App` namespace. By default, a new project will have a file called `src/app.d.ts` containing the following:

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
