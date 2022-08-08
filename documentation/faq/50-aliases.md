---
title: パスのエイリアスを設定するにはどうすればよいですか？
---

エイリアスは `svelte.config.js` で設定することができます。詳細は [`configuration`](/docs/configuration#alias) ドキュメントをご覧ください。

それから `npm run prepare` または `npm run dev` を実行します (どちらも sync コマンドを実行します)。すると SvelteKit が自動で必要なエイリアス設定を `jsconfig.json` または `tsconfig.json` に生成します。
