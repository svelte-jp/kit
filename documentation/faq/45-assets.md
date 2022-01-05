---
question: キャッシュのためにアセットのファイル名をハッシュ化するには？
---

以下のように、アセットをインポートすることでViteに処理をさせることができます:

```html
<script>
	import imageSrc from '$lib/assets/image.png';
</script>

<img src="{imageSrc}" />
```

もしマークアップに直接インポートしたければ、[svelte-preprocess-import-assets](https://github.com/bluwy/svelte-preprocess-import-assets) を使用すればこのように書くことができます:

```html
<img src="$lib/assets/image.png" />
```
