`.env` ファイルや `process.env` から [Vite が読み込む](https://vitejs.dev/guide/env-and-mode.html#env-files) 環境変数です。[`$env/dynamic/private`](https://kit.svelte.jp/docs/modules#$env-dynamic-private) と同様に、このモジュールはクライアントサイドコードにインポートすることはできません。このモジュールには、変数名が [`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#env) で始まらない、かつ、[`config.kit.env.privatePrefix`](https://kit.svelte.jp/docs/configuration#env) で始まる変数のみを含んでいます (設定されている場合に限る)。

[`$env/dynamic/private`](https://kit.svelte.jp/docs/modules#$env-dynamic-private) とは _異なり_ 、このモジュールからエクスポートされた値はビルド時に静的に注入され、デッドコードの排除などの最適化が可能になります。

```ts
import { API_KEY } from '$env/static/private';
```

コード内で参照される環境変数は、たとえアプリがデプロイされるまで値を持たない場合でも、すべて (例えば `.env` ファイルで) 宣言する必要があることに注意してください。:

```
MY_FEATURE_FLAG=""
```

このように、コマンドラインから `.env` の値を上書きすることができます:

```bash
MY_FEATURE_FLAG="enabled" npm run dev
```
