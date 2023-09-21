---
title: Integrations
---

## Preprocessors

プリプロセッサ(Preprocessors)は、`.svelte` ファイルをコンパイラに渡す前に変換します。例えば、`.svelte` ファイルに TypeScript と PostCSS が使用されている場合、それを最初に JavaScript と CSS に変換し、Svelte コンパイラが処理できるようにしなければなりません。多数の [プリプロセッサが使用可能](https://sveltesociety.dev/tools#preprocessors) です。The Svelte team maintains two official ones discussed below.

### `vitePreprocess`

`vite-plugin-svelte` には [`vitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) という機能があり、Vite をプリプロセスに用いることができます。これによって Vite が扱える言語フレーバー (TypeScript、PostCSS、SCSS、Less、Stylus、SugarSS) の処理が可能になります。便宜上、これは `@sveltejs/kit/vite` パッケージから再エクスポートされています。プロジェクトに TypeScript を設定すると、これがデフォルトで含まれるようになります:

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/kit/vite';

export default {
  preprocess: [vitePreprocess()]
};
```

### `svelte-preprocess`

`svelte-preprocess` は、Pug、Babel、global styles のサポートなど、`vitePreprocess` には無い機能があります。しかし、`vitePreprocess` はより速く、設定が少ないため、デフォルトでは `vitePreprocess` が使用されます。SvelteKit は CoffeeScript を [サポートしていない](https://github.com/sveltejs/kit/issues/2920#issuecomment-996469815) ことにご注意ください。

`svelte-preprocess` をインストールするには `npm install --save-dev svelte-preprocess` を実行し、ご自身で [`svelte.config.js` に追加する](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/usage.md#with-svelte-config) 必要があります。その後、`npm install -D sass` や `npm install -D less` など、[対応するライブラリのインストール](https://github.com/sveltejs/svelte-preprocess/blob/main/docs/getting-started.md) が必要になることが多いようです。

## Adders

[Svelte Adders](https://sveltesociety.dev/templates#adders) は、Tailwind、PostCSS、Storybook、Firebase、GraphQL、mdsvexなど、様々な複雑なインテグレーションを1つのコマンドでセットアップできるようにしてくれます。Svelte と SvelteKitで利用可能なテンプレート、コンポーネント、ツールの全ての一覧については、 [sveltesociety.dev](https://sveltesociety.dev/) をご覧ください。

## Vite plugins

Since SvelteKit projects are built with Vite, you can use Vite plugins to enhance your project. See a list of available plugins at [`vitejs/awesome-vite`](https://github.com/vitejs/awesome-vite).

## Integration FAQs

SvelteKit FAQ に [SvelteKit で X をする方法](./faq#how-do-i-use-x-with-sveltekit) があるので、もしまだ不明点があるようでしたら役に立つかもしれません。
