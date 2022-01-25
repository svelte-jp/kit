---
title: package.json
---

### type: "module"

`package.json` に `"type": "module"` を追加します。もし Sapper 0.29.3 以降を使用している場合は、インクリメンタルマイグレーションの一部として、このステップを他のステップとは別に行うことができます。


### dependencies

`polka` や `express` を使用している場合はそれを削除し、`sirv` や `compression` などのミドルウェア(middleware)も削除します。

### devDependencies

`devDependencies` から `sapper` を削除し、`@sveltejs/kit` と使用予定の [adapter](/docs#adapters)に置き換えます([次のセクション](#project-files-configuration)をご覧ください)。

### scripts

`sapper` を参照しているスクリプトを全て更新します:

- `sapper build` は [`svelte-kit build`](/docs#command-line-interface-svelte-kit-build) になります。Node [adapter](/docs#adapters) を使用します。
- `sapper export` は [`svelte-kit build`](/docs#command-line-interface-svelte-kit-build) になります。static [adapter](/docs#adapters) を使用します。
- `sapper dev` は [`svelte-kit dev`](/docs#command-line-interface-svelte-kit-dev) になります
- `node __sapper__/build` は `node build` になります
