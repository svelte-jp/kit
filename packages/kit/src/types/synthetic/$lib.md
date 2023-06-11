これは `src/lib` (または [`config.kit.files.lib`](https://kit.svelte.jp/docs/configuration#files) に指定されたディレクトリ) へのシンプルなエイリアスです。`../../../../` のようなナンセンスなことをせずに、共通のコンポーネントやユーティリティモジュールにアクセスすることができます。

### `$lib/server`

`$lib` のサブディレクトリです。SvelteKit は、クライアントサイドコードに `$lib/server` のモジュールがインポートされるのを防ぎます。[server-only modules](/docs/server-only-modules) をご参照ください。
