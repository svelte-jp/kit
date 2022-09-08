このモジュールは、実行中のプラットフォームで定義された、実行時の環境変数へのアクセスを提供します。例えば、[`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) を使用している場合 (または [`vite preview`](https://kit.svelte.jp/docs/cli) を実行中の場合)、これは `process.env` と同じです。このモジュールは [`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#kit-env-publicprefix) で始まらない変数のみを含んでいます。

このモジュールはクライアントサイドのコードにインポートできません。

```ts
import { env } from '$env/dynamic/private';
console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
```

> In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
