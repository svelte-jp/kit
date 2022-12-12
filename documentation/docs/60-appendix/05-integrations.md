---
title: Integrations
---

## Preprocessors

プリプロセッサ(Preprocessors)は、`.svelte` ファイルをコンパイラに渡す前に変換します。例えば、`.svelte` ファイルに TypeScript と PostCSS が使用されている場合、それを最初に JavaScript と CSS に変換し、Svelte コンパイラが処理できるようにしなければなりません。多数の [プリプロセッサが使用可能](https://sveltesociety.dev/tools#preprocessors) です。The Svelte team maintains two official ones discussed below.

### `vitePreprocess`

`vite-plugin-svelte` offers a [`vitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) feature which utilizes Vite for preprocessing. It is capable of handling the language flavors Vite handles: TypeScript, PostCSS, SCSS, Less, Stylus, and SugarSS. For convenience, it is re-exported from the `@sveltejs/kit/vite` package. If you set your project up with TypeScript it will be included by default:

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/kit/vite';

export default {
  preprocess: [vitePreprocess()]
};
```

### `svelte-preprocess`

`svelte-preprocess` has some additional functionality not found in `vitePreprocess` such as support for Pug, Babel, and global styles. However, `vitePreprocess` may be faster and require less configuration, so it is used by default. Note that CoffeeScript is [not supported](https://github.com/sveltejs/kit/issues/2920#issuecomment-996469815) by SvelteKit.

You will need to install `svelte-preprocess` with `npm install --save-dev svelte-preprocess` and [add it to your `svelte.config.js`](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/usage.md#with-svelte-config). After that, you will often need to [install the corresponding library](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md) such as `npm install -D sass` or `npm install -D less`.

## Adders

[Svelte Adders](https://sveltesociety.dev/templates#adders) は、Tailwind、PostCSS、Storybook、Firebase、GraphQL、mdsvexなど、様々な複雑なインテグレーションを1つのコマンドでセットアップできるようにしてくれます。Svelte と SvelteKitで利用可能なテンプレート、コンポーネント、ツールの全ての一覧については、 [sveltesociety.dev](https://sveltesociety.dev/) をご覧ください。

## Integration FAQs

SvelteKit FAQ に [インテグレーションのセクション](/faq#integrations) があるので、もしまだ不明点があるようでしたら役に立つかもしれません。
