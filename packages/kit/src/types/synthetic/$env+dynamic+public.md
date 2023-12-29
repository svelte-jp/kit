[`$env/dynamic/private`](https://kit.svelte.jp/docs/modules#$env-dynamic-private) と似ていますが、[`config.kit.env.publicPrefix`](https://kit.svelte.jp/docs/configuration#env) (デフォルトは `PUBLIC_`) で始まる変数のみを含んでおり、クライアントサイドのコードに安全に公開することができます。

パブリックで動的な環境変数は全て、サーバーからクライアントに送られるため、より大きなネットワークリクエストを引き起こすことにご注意ください。可能であれば、代わりに `$env/static/public` をお使いください。

Dynamic environment variables cannot be used during prerendering.

```ts
import { env } from '$env/dynamic/public';
console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
```
