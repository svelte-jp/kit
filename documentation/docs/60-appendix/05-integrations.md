---
title: Integrations
---

## Preprocessors

プリプロセッサ(Preprocessors)は、`.svelte` ファイルをコンパイラに渡す前に変換します。例えば、`.svelte` ファイルに TypeScript と PostCSS が使用されている場合、それを最初に JavaScript と CSS に変換し、Svelte コンパイラが処理できるようにしなければなりません。多数の [プリプロセッサが使用可能](https://sveltesociety.dev/tools#preprocessors) です。

[`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) は Svelte テンプレート内のコードを自動的に変換し、TypeScript、PostCSS、scss/sass、Less、その他多くのテクノロジー(SvelteKitが[サポートしていない](https://github.com/sveltejs/kit/issues/2920#issuecomment-996469815) CoffeeScriptは除く)のサポートを提供します。設定の最初のステップは [`svelte.config.js`](/docs/configuration) に `svelte-preprocess` を追加することです。これは、TypeScript を使用している場合はテンプレートで提供されていますが、JavaScriptのユーザーは追加する必要があります。その後に、`npm install -D sass` や `npm install -D less` のように、対応するライブラリをインストールするだけで良い場合が多いです。詳しくは [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) のドキュメントをご参照ください。

また、`vite-plugin-svelte` には [`vitePreprocess`](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/preprocess.md) 機能があり、Vite をプリプロセスに用いることができ、それによって高速かつ少ない設定でプリプロセスを行うことができます。このオプションを使用するには、最初に `npm install --save-dev @sveltejs/vite-plugin-svelte` を実行し、そのあとで `svelte.config.js` を更新します:

```js
// svelte.config.js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: [vitePreprocess()]
};
```

## Adders

[Svelte Adders](https://sveltesociety.dev/templates#adders) は、Tailwind、PostCSS、Storybook、Firebase、GraphQL、mdsvexなど、様々な複雑なインテグレーションを1つのコマンドでセットアップできるようにしてくれます。Svelte と SvelteKitで利用可能なテンプレート、コンポーネント、ツールの全ての一覧については、 [sveltesociety.dev](https://sveltesociety.dev/) をご覧ください。

## Integration FAQs

SvelteKit FAQ に [インテグレーションのセクション](/faq#integrations) があるので、もしまだ不明点があるようでしたら役に立つかもしれません。
