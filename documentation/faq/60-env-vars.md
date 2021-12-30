---
question: 環境変数を使用するにはどうしたらよいですか？
---

Vite は [dotenv](https://github.com/motdotla/dotenv) を使用して、`.env` などのファイルから環境変数を読み込んでいます。`VITE_` というプレフィックスを持つ環境変数のみが公開されます（[これは`envPrefix` を設定することで変更可能です](https://vitejs.dev/config/#envprefix)）。Vite はこれらを使用し、ビルド時に静的に置き換えます。

実行時に環境変数を使用するには、サーバーサイドのコードで dotenv をインスタンス化し、`process.env.YOUR_ENV_VAR` で環境変数が公開されるようにする必要があります。また必要であれば、`$session` を使ってクライアントに渡すこともできます。

環境変数についてのより詳しい情報は、[Viteのドキュメント](https://vitejs.dev/guide/env-and-mode.html#env-files) を参照してください。
