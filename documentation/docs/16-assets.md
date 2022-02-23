---
title: アセットハンドリング
---

### ハッシュ化

アセットのファイル名にハッシュを含めてそれをキャッシュする場合は、以下のようにアセットをインポートすることで、Vite にアセットを処理させることができます:

```html
<script>
	import logo from '$lib/assets/logo.png';
</script>

<img alt="The project logo" src={logo} />
```

マークアップから直接アセットを参照したければ、[svelte-preprocess-import-assets](https://github.com/bluwy/svelte-preprocess-import-assets) や [svelte-image](https://github.com/matyunya/svelte-image) などのプリプロセッサをお使い頂けます。

CSS 関数の `url()` でインクルードされたアセットの場合は、[`experimental.useVitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#usevitepreprocess) オプションが役立つでしょう:

```js
// svelte.config.js
export default {
	experimental: {
		useVitePreprocess: true
	}
};
```

### 最適化

`.webp` や `.avif` などの圧縮イメージフォーマットや、デバイスのスクリーンに基づいて異なるサイズをサーブするレスポンシブイメージを利用したいことがあるかもしれません。プロジェクトに静的に含まれているイメージの場合、[svelte-image](https://github.com/matyunya/svelte-image) のようなプリプロセッサや、[vite-imagetools](https://github.com/JonasKruckenberg/imagetools) のような Vite plugin をお使いください。
