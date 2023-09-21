---
title: イントロダクション
---

## 始める前に <!--before-we-begin-->

> Svelte や SvelteKit が初めてなら、こちらの[インタラクティブなチュートリアル](https://learn.svelte.jp)をチェックしてみることをおすすめします。
>
> 行き詰まったら、[Discord chatroom](https://svelte.dev/chat) でヘルプを求めてください。(日本語翻訳版 追記：上記のDiscordはSvelte本体のもので、英語でコミュニケーションが行われています。もし日本語で質問したり交流したいのであれば、[Svelte日本のDiscord](https://discord.com/invite/YTXq3ZtBbx)にどうぞ！)

## SvelteKitとは <!--what-is-sveltekit-->

SvelteKit は、[Svelte](https://svelte.jp/) を使用して堅牢でハイパフォーマンスな web アプリケーションを迅速に開発するためのフレームワークです。もしあなたが React 界隈から来たのであれば、SvelteKit は Next に似ているものです。Vue 界隈から来たのであれば、Nuxt に似ています。

SvelteKit で構築することのできるアプリケーションの種類については、[FAQ](/docs/faq#what-can-i-make-with-sveltekit) をご覧ください。

## Svelteとは <!--what-is-svelte-->

手短に言えば Svelte は、ナビゲーションバーやコメントセクション、コンタクトフォームなど、ユーザーがブラウザで見たり操作したりするユーザーインターフェースコンポーネントを書く方法です。Svelte コンパイラは、コンポーネントを、ページの HTML をレンダリングする実行可能な JavaScriptと、ページのスタイリングをする CSS に変換します。このガイドの残りの部分を理解するのに Svelte を知っておく必要はありませんが、もし知っていれば役に立つでしょう。より詳しく知りたい場合は、[Svelte のチュートリアル](https://svelte.jp/tutorial) をご覧ください。

## SvelteKit vs Svelte

Svelte は UI コンポーネントをレンダリングします。Svelte だけでも、コンポーネントを組み合わせてページ全体をレンダリングすることは可能ですが、アプリ全体を書くには Svelte だけでなく、他のものも必要です。

SvelteKit は、リンクがクリックされたときに UI を更新する [ルーター](glossary#routing) や、[サーバーサイドレンダリング (SSR)](glossary#ssr) といった基本的な機能を提供していますが、それだけではありません。モダンなベストプラクティスを全て取り入れたアプリを構築するのは、恐ろしく複雑なことです。モダンなベストプラクティスとは、必要最小限のコードのみをロードするための [ビルド最適化](https://ja.vitejs.dev/guide/features.html#%E3%83%93%E3%83%AB%E3%83%89%E3%81%AE%E6%9C%80%E9%81%A9%E5%8C%96)、[オフラインサポート](service-workers)、[プリロード](link-options#data-sveltekit-preload-data)(ユーザーがナビゲーションを開始する前にページを事前読み込みする)、[柔軟な設定が可能なレンダリング](page-options)(アプリのある部分は [SSR](glossary#ssr) によってサーバー上でレンダリングさせたり、また別の部分はブラウザで [クライアントサイドレンダリング](glossary#csr)させたり、また別の部分はビルド時に[プリレンダリング](glossary#prerendering)させたりすることが可能)、その他様々な事柄です。SvelteKit が全ての退屈な作業を行ってくれるので、あなたはクリエイティブな作業に専念することができます。

[Svelte plugin](https://github.com/sveltejs/vite-plugin-svelte) で [Vite](https://vitejs.dev/) を動かして [Hot Module Replacement (HMR)](https://github.com/sveltejs/vite-plugin-svelte/blob/main/docs/config.md#hot) を行うことで、コードの変更を即座にブラウザに反映し、非常に高速でフィーチャーリッチな開発体験を提供します。
