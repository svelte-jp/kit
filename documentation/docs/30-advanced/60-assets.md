---
title: アセットハンドリング
---

## キャッシュとインライン化(Caching and inlining)

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

## 変換(Transforming)

イメージを変換して、`.webp` や `.avif` などの圧縮イメージフォーマットに変換したり、デバイスごとに異なるサイズのレスポンシブイメージを出力したり、プライバシーのために EXIF データを取り除いたイメージを出力したいことがあるかもしれません。静的に含まれるイメージについては、[vite-imagetools](https://github.com/JonasKruckenberg/imagetools) などの Vite プラグインを使用することができます。HTTP ヘッダーやクエリ文字列パラメータに基づいて適切に変換されたイメージを提供できる CDN を検討することもできます。
