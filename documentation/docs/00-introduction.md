---
title: Introduction
---

### 始める前に

> SvelteKitはまだ開発早期段階で、1.0に到達するまでに変更される可能性があります。このドキュメントは作業途中のものです。もし行き詰まったら、[Discord チャットルーム](https://svelte.dev/chat)にどうぞ。
>
> Sapper からのアップグレードについては [migration guides(移行ガイド)](/docs/migrating) をご覧ください。

### SvelteKitとは

SvelteKitはとてもハイパフォーマンスなWebアプリを構築するためのフレームワークです。

モダンなベストプラクティスを全て取り入れたアプリを構築するのは、恐ろしく複雑なことです。これらのプラクティスには、必要最小限のコードのみをロードするための[ビルドの最適化](https://ja.vitejs.dev/guide/features.html#%E3%83%93%E3%83%AB%E3%83%89%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96)、[オフラインサポート](/docs/service-workers)、[プリフェッチ](/docs/a-options#sveltekit-prefetch) (ユーザーがナビゲーションを開始する前
にページを取得すること)、[様々な設定が可能なレンダリング](/docs/page-options) (HTMLの生成を[サーバー上](/docs/appendix#ssr)で行うか[ブラウザ上](/docs/page-options#router)で行うか、それをランタイムで行うか[ビルド時](/docs/page-options#prerender)に行うかなど) が含まれています。SvelteKitが全ての退屈な作業を行ってくれるので、あなたはクリエイティブな作業に専念することができます。

[Vite](https://ja.vitejs.dev/) を [Svelte plugin](https://github.com/sveltejs/vite-plugin-svelte) 経由で使用しており、非常に高速で機能豊富な開発体験を提供します。[Hot Module Replacement (HMR)](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#hot)により、コードを変更すると即座にブラウザに反映されます。

このガイドを理解するためにSvelteを知っておく必要はありませんが、知っていれば役に立つでしょう。簡単に紹介しておくと、Svelteはコンポーネントを高度に最適化されたvanilla JavaScriptにコンパイルしてくれるUIフレームワークです。詳しくは、[Svelteを紹介するブログ記事](https://svelte.jp/blog/svelte-3-rethinking-reactivity)と[Svelteチュートリアル](https://svelte.jp/tutorial)を読んでみてください。

### Getting started

The easiest way to start building a SvelteKit app is to run `npm create`:

```bash
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
```

The first command will scaffold a new project in the `my-app` directory asking you if you'd like to set up some basic tooling such as TypeScript. See the FAQ for [pointers on setting up additional tooling](https://kit.svelte.dev/faq#integrations). The subsequent commands will then install its dependencies and start a server on [localhost:5173](http://localhost:5173).

ここには2つの基本的なコンセプトがあります。

- アプリの各ページは [Svelte](https://svelte.jp) コンポーネントです
- プロジェクトの `src/routes` ディレクトリにファイルを追加することで、ページを作成できます。これらはサーバーでレンダリングされるのでユーザーの最初のアクセスの際に可能な限り速く表示されるようになり、それからクライアントサイドのアプリに引き継がれます。

ファイルを編集して、どのように動作するのか確かめてみてください。もしかしたら、もうこれ以降のガイドを読む必要はないかもしれません！

#### エディタのセットアップ

[Visual Studio Code (通称 VS Code)](https://code.visualstudio.com/download) と [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) のご使用をおすすめしていますが、[他にも数多くのエディタをサポートしています](https://sveltesociety.dev/tools#editor-support)。
