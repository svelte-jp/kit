---
title: イントロダクション
---

## 始める前に

> SvelteKit は 1.0 に向けたリリース候補段階 (release candidate phase) で、報告された issue に対応しつつ、磨きをかけています。もし行き詰まったら、[Discord チャットルーム](https://svelte.dev/chat)にどうぞ。
>
> Sapper からのアップグレードについては [migration guides(移行ガイド)](/docs/migrating) をご覧ください。

## SvelteKitとは

SvelteKitはとてもハイパフォーマンスなWebアプリを構築するためのフレームワークです。

モダンなベストプラクティスを全て取り入れたアプリを構築するのは、恐ろしく複雑なことです。これらのプラクティスには、必要最小限のコードのみをロードするための[ビルドの最適化](https://ja.vitejs.dev/guide/features.html#%E3%83%93%E3%83%AB%E3%83%89%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96)、[オフラインサポート](/docs/service-workers)、[プリロード](/docs/link-options#data-sveltekit-preload-data) (ユーザーがナビゲーションを開始する前
にページを取得すること)、[設定可能なレンダリング](/docs/page-options) (アプリのレンダリングを[サーバー上](/docs/glossary#ssr)で行うか[ブラウザ上](/docs/glossary#csr-and-spa)で行うか、それをランタイムで行うか[ビルド時](/docs/glossary#prerendering)に行うかなど) が含まれています。SvelteKitが全ての退屈な作業を行ってくれるので、あなたはクリエイティブな作業に専念することができます。

[Vite](https://ja.vitejs.dev/) を [Svelte plugin](https://github.com/sveltejs/vite-plugin-svelte) 経由で使用しており、非常に高速で機能豊富な開発体験を提供します。[Hot Module Replacement (HMR)](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#hot)により、コードを変更すると即座にブラウザに反映されます。

このガイドを理解するためにSvelteを知っておく必要はありませんが、知っていれば役に立つでしょう。簡単に紹介しておくと、Svelteはコンポーネントを高度に最適化されたvanilla JavaScriptにコンパイルしてくれるUIフレームワークです。詳しくは、[Svelteを紹介するブログ記事](https://svelte.jp/blog/svelte-3-rethinking-reactivity)と[Svelteチュートリアル](https://svelte.jp/tutorial)を読んでみてください。
