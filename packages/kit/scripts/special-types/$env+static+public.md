[`$env/static/private`](https://kit.svelte.jp/docs/modules#$env-static-private) と似ていますが、[`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (デフォルトは `PUBLIC_`) で始まる変数のみを含んでおり、クライアントサイドのコードに安全に公開することができます。

値はビルド時に静的に置き換えられます。

```ts
import { PUBLIC_BASE_URL } from '$env/static/public';
```
