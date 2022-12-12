<script>
	import Section from '@sveltejs/site-kit/components/Section.svelte';
</script>

<Section --background="var(--sk-back-1)">
	<div class="container">
		<div class="features">
			<h2><span>機能? 揃ってます。</span></h2>
			<p class="wall">
				最大限のパフォーマンスを得られる <strong>プリレンダリング</strong> ページと
				最大限の柔軟性を持つ <strong>サーバーサイドレンダリング</strong> を組み合わせることができます。たった1行追加するだけで、
				アプリをクライアントレンダリングする
				<strong>PWA</strong> にすることができ、しかもそれを全体に適用することも単一ページに適用することもできます。
				アクセシブルな <strong>クライアントサイドルーティング</strong> と自動的な
				<strong>プリロード</strong> を使用し、ページ全体(と analytics やその他全てのジャンク)を再読み込みすることなく、
				なめらかで瞬間的なナビゲーションを実現することができます。自動的な
				<strong>CSRF 保護</strong>
				と、使いやすい
				<strong>Content Security Policy</strong> 設定によってユーザーを守ることができます。
				高度な <strong>環境変数</strong> 処理により、秘情報を保護することができます。処理安全(gracefully)かつ
				<strong>セキュア</strong> なエラー処理ができます。データを
				<strong>直接データベースから読み込み</strong>
				、<strong>型安全</strong> なデータ読み込みと
				ビルトインの <strong>form actions</strong>
				(JavaScriptが無くても動作します)によってバックエンドとフロントエンドをつなぎます。他のクライアントサイドルーティングフレームワークと同じページで <strong>共存</strong>
				できます。<strong>オフライン</strong>サポートのために
				service worker を追加できます。必要に応じて <strong>AMP 準拠</strong>
				のページを生成します。非常に強力な
				<strong>ファイルシステムベースのルーティング</strong> によって複雑な UI を構築できます。入れ子のレイアウト(Nested layouts)? 当然です。様々な環境で動作する
				<strong>web スタンダード</strong>
				を学ぶことができます。<strong>Tailwind</strong>
				や <strong>Playwright</strong>、<strong>Vitest</strong>、<strong>Storybook</strong>
				など、あなたが望むものとインテグレートできます。アプリだけでなく <strong>ライブラリ</strong> を構築することができます。
				adapter によって <strong>どこにでもデプロイ</strong> することができます。
			</p>

			<p>
				SvelteKit は、あなたが構築するものがなんであれ、
				<strong>あなたとともに成長する</strong> フレームワークです。
			</p>
		</div>
	</div>
</Section>

<style>
	.container {
		display: flex;
		flex-direction: column;
	}

	.features {
		order: 1;
		text-align: justify;
	}

	h2 {
		float: right;
		width: 5.5em;
	}

	h2 span {
		display: block;
		text-align: right;
		width: 5em;
		margin: 0 0 0 auto;
	}

	.wall {
		margin: 0;
		font-size: var(--sk-text-xs);
	}

	p + p {
		margin-top: 1em;
	}

	p,
	strong {
		color: var(--sk-text-3);
	}

	@media (min-width: 600px) {
		h2 {
			margin-top: 0.5em;
			width: 10em;
		}

		h2 span {
			width: auto;
		}

		/* TODO remove the 62.5% hack so we can use rems in media queries */
		.container {
			--size: 40rem;
			display: block;
		}

		.features {
			padding: 2rem 0 2rem calc(0 * var(--size));
		}
	}

	@media (min-width: 900px) {
		.container {
			--size: 45rem;
		}

		h2 {
			margin-top: 0.1em;
		}

		p {
			font-size: var(--sk-text-s);
		}

		.features {
			padding-top: clamp(0px, calc(23.333vw - 210px), 70px);
		}
	}
</style>
