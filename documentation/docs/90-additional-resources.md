---
title: Additional Resources
---

### FAQs

よくある問題の解決方法や役に立つ tips や tricks については、[SvelteKit FAQ](/faq) をご覧ください。

[Svelte FAQ](https://svelte.jp/faq) と [`vite-plugin-svelte` FAQ](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/faq.md) も、これらのライブラリに起因する疑問点には役立つでしょう。

### Examples

例として、数種類 SvelteKit サイトを作成し、公開しています:

- [examples ディレクトリ](https://github.com/sveltejs/kit/tree/master/examples) (GitHubリポジトリ内) には、HackerNews のクローンがあります
- [`sveltejs/realworld`](https://github.com/sveltejs/realworld) にはブログサイトの例があります
- [`sveltejs/sites`](https://github.com/sveltejs/sites) にはこのサイトのコードがあります
- [`sveltejs/svelte` リポジトリの site ディレクトリ](https://github.com/sveltejs/svelte/tree/master/site) には svelte.dev のコードが含まれています。

### Integrations

[`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) は Svelte テンプレート内のコードを自動的に変換し、TypeScript、PostCSS、scss/sass、Less、その他多くのテクノロジー(SvelteKitが[サポートしていない](https://github.com/sveltejs/kit/issues/2920#issuecomment-996469815) CoffeeScriptは除く)のサポートを提供します。設定の最初のステップは [`svelte.config.js`](#configuration) に `svelte-preprocess` を追加することです。これは、TypeScript を使用している場合はテンプレートで提供されていますが、JavaScriptのユーザーは追加する必要があります。その後に、`npm install -D sass` や `npm install -D less` のように、対応するライブラリをインストールするだけで良い場合が多いです。詳しくは [`svelte-preprocess`](https://github.com/sveltejs/svelte-preprocess) のドキュメントをご参照ください。

[Svelte Adders](https://sveltesociety.dev/templates#adders) は、Tailwind、PostCSS、Firebase、GraphQL、mdsvexなど、様々な複雑なインテグレーションを1つのコマンドでセットアップできるようにしてくれます。Svelte と SvelteKitで利用可能なテンプレート、コンポーネント、ツールのフルの一覧については、 [sveltesociety.dev](https://sveltesociety.dev/) をご覧ください。

また、SvelteKit FAQ にも [インテグレーションの章](/faq#integrations) がありますので、何か問題が発生した場合はそちらも役立つでしょう。

### Support

[Discord](https://svelte.dev/chat) や [StackOverflow](https://stackoverflow.com/questions/tagged/sveltekit) でヘルプを求めることができます。他の方の時間を尊重するため、まずは FAQ、Googleまたは他の検索エンジン、issue tracker、Discord のチャット履歴などから、問題に関連する情報を検索してください。回答する方より質問する方のほうが多いので、こうすることでコミュニティをスケーラブルに発展させることができると思います。
