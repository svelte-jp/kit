---
question: SvelteKit で HMR を使うにはどうすればよいですか？
---

SvelteKit は [svelte-hmr](https://github.com/sveltejs/svelte-hmr) によってデフォルトで HMR が有効になっています。[Rich の 2020 Svelte Summit のプレゼンテーション](https://svelte.jp/blog/whats-the-deal-with-sveltekit) を見たことがあるなら、より強力そうに見えるバージョンの HMR をご覧になったかもしれません。あのデモでは `svelte-hmr` の `preserveLocalState` フラグがオンになっていました。このフラグは想定外の動作やエッジケースにつながる可能性があるため、現在はデフォルトでオフになっています。でもご心配なく、SvelteKit で HMR を利用することはできます！もしローカルの状態を保持したい場合は、[svelte-hmr](https://github.com/sveltejs/svelte-hmr) ページに説明があるように、`@hmr:keep` または `@hmr:keep-all` ディレクティブを使用することができます。
