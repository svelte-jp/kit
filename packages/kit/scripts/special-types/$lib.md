これは `src/lib` (または [`config.kit.files.lib`](https://kit.svelte.jp/docs/configuration#files) に指定されたディレクトリ) へのシンプルなエイリアスです。`../../../../` のようなナンセンスなことをせずに、共通のコンポーネントやユーティリティモジュールにアクセスすることができます。

#### `$lib/server`

A subdirectory of `$lib`. SvelteKit will prevent you from importing any modules in `$lib/server` into public-facing code. See [server-only modules](/docs/server-only-modules).
