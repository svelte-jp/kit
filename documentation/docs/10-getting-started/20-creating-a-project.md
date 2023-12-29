---
title: プロジェクトを作成する
---

SvelteKit アプリの構築を始めるのに最も簡単な方法は `npm create` を実行することです:

```bash
npm create svelte@latest my-app
cd my-app
npm install
npm run dev
```

最初のコマンドでは、TypeScript などの基本的なツールをセットアップするかどうか選択しながら、`my-app` ディレクトリに新しいプロジェクトを生成します。追加のツールの設定に関するポイントについては [Integrations](./integrations) をご覧ください。それ以降のコマンドでは、依存関係をインストールし、[localhost:5173](http://localhost:5173) でサーバーを起動します。

SvelteKit には2つの基本的なコンセプトがあります:

- アプリの各ページは [Svelte](https://svelte.jp) コンポーネントです
- プロジェクトの `src/routes` ディレクトリにファイルを追加することで、ページを作成できます。これらはサーバーでレンダリングされるのでユーザーの最初のアクセスの際に可能な限り速く表示されるようになり、それからクライアントサイドのアプリに引き継がれます

ファイルを編集して、どのように動作するのか確かめてみてください。

## エディタのセットアップ <!--editor-setup-->

[Visual Studio Code (通称 VS Code)](https://code.visualstudio.com/download) と [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) のご使用をおすすめしますが、[他にも数多くのエディタをサポートしています](https://sveltesociety.dev/resources#editor-support)。
