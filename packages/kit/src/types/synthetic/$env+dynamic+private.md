このモジュールは、実行中のプラットフォームで定義された、実行時の環境変数へのアクセスを提供します。例えば、[`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) を使用している場合 (または [`vite preview`](https://kit.svelte.jp/docs/cli) を実行中の場合)、これは `process.env` と同じです。このモジュールには、変数名が [`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#env) で始まらない、かつ、[`config.kit.env.privatePrefix`](https://kit.svelte.jp/docs/configuration#env) で始まる変数のみを含んでいます (設定されている場合に限る)。

このモジュールをクライアントサイドコードにインポートすることはできません。

```ts
import { env } from '$env/dynamic/private';
console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
```

> 開発中(In `dev`)は、`$env/dynamic` には常に `.env` からの環境変数が含まれます。本番(In `prod`)では、この動作は使用する adapter に依存します。
