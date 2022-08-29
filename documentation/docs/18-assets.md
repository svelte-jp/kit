---
title: アセットハンドリング
---

### Caching and inlining

パフォーマンス改善のため、[Vite はインポートされたアセットを自動的に処理します](https://vitejs.dev/guide/assets.html)。ハッシュがファイル名に追加されるのでキャッシュできるようになり、`assetsInlineLimit` より小さいアセットはインライン化されます。

```html
<script>
	import logo from '$lib/assets/logo.png';
</script>

<img alt="The project logo" src={logo} />
```

マークアップから直接アセットを参照したければ、[svelte-preprocess-import-assets](https://github.com/bluwy/svelte-preprocess-import-assets) などのプリプロセッサをお使い頂けます。

CSS 関数の `url()` でインクルードされたアセットの場合は、[`experimental.useVitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#usevitepreprocess) オプションが役立つでしょう:

```js
// svelte.config.js
export default {
	vitePlugin: {
		experimental: {
			useVitePreprocess: true
		}
	}
};
```

### Transforming

You may wish to transform your images to output compressed image formats such as `.webp` or `.avif`, responsive images with different sizes for different devices, or images with the EXIF data stripped for privacy. For images that are included statically, you may use a Vite plugin such as [vite-imagetools](https://github.com/JonasKruckenberg/imagetools). You may also consider a CDN, which can serve the appropriate transformed image based on the `Accept` HTTP header and query string parameters.
