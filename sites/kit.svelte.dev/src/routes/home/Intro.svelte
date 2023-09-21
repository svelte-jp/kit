<script>
	import { Blurb } from '@sveltejs/site-kit/home';
</script>

<Blurb --background="var(--sk-back-1)">
	<div slot="one">
		<h2>高速</h2>
		<p>
			<a target="_blank" rel="noreferrer" href="https://svelte.jp">Svelte</a>と 
			<a target="_blank" rel="noreferrer" href="https://vitejs.dev">Vite</a> を使用しており、
			あらゆる部分にその速さが組み込まれています: 高速なセットアップ、高速な開発、高速なビルド、高速なページロード、高速なナビゲーション。
		</p>
	</div>

	<div slot="two">
		<h2>楽しい</h2>
		<p>
			もうこれ以上、バンドラーのコンフィグやルーティング、SSR、CSP、TypeScript、デプロイの設定、その他全ての退屈な作業に時間を費やすことはありません。
			コーディングに喜びを。
		</p>
	</div>

	<div slot="three">
		<h2>柔軟</h2>
		<p>
			SPA? MPA? SSR? SSG? 全て対応しています。SvelteKit は、構築しようとしているものが何であれ、それを実現するためのツールを提供します。
			そして、JavaScript が動作するところならどこでも動作します。
		</p>
	</div>
</Blurb>

<style>
	p {
		font-size: var(--sk-text-m);
	}
</style>
