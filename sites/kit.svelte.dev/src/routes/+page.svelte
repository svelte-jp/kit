<script>
	import { Blurb } from '@sveltejs/site-kit';
	import Hero from './Hero.svelte';
	import Logotype from './svelte-kit-logotype.svg';
	import Machine from './svelte-kit-machine.webp?w=1440;800;600;480&format=avif;webp;png&picture';
</script>

<svelte:head>
	<title>SvelteKit • Svelteアプリを最速で構築する方法</title>

	<meta name="twitter:title" content="SvelteKit" />
	<meta name="twitter:description" content="Svelteアプリを最速で構築する方法" />
	<meta name="description" content="SvelteKitはオフィシャルなSvelteアプリケーションフレームワーク" />
</svelte:head>

<h1 class="visually-hidden">SvelteKit</h1>
<Hero
	title="SvelteKit"
	logotype={Logotype}
	tagline="Svelteアプリを最速で構築する方法"
	background={Machine}
	alt="SvelteKit illustration"
/>

<div class="blurb-shifter">
	<Blurb>
		<div slot="one">
			<h2>Powered by Svelte</h2>
			<p>
				SvelteKitはSvelteを利用したアプリケーションフレームワークです - 大きいアプリを小さいフットプリントで構築できます
			</p>

			<a href="https://svelte.jp" class="cta">Svelteを学ぶ</a>
		</div>

		<div slot="two">
			<h2>Best of both worlds</h2>
			<p>
				サーバーレンダリングアプリのSEOとプログレッシブエンハンスメント、SPAの洗練されたナビゲーションを全て備えています
			</p>

			<a data-sveltekit-preload-data href="/docs" class="cta">ドキュメントを読む</a>
		</div>

		<div slot="three">
			<h2>Build fast</h2>
			<p>
				高度なルーティング、サーバーサイドレンダリング、コード分割、オフラインサポートなどをすぐにお使いいただけます。
			</p>

			<a data-sveltekit-preload-data href="/docs" class="cta">ドキュメントを読む</a>
		</div>

		<div class="description" slot="what">
			<p>
				SvelteKitはあらゆる規模のWebアプリケーションを構築できるフレームワークです。
				素晴らしい開発体験と柔軟なファイルシステムベースのルーティングを備えています。
			</p>

			<p>
				シングルページアプリとは異なり、SvelteKitはSEO・プログレッシブエンハンスメント・初期ロードを犠牲にしません。
				また、トラディショナルなサーバーレンダリングアプリとは異なり、ナビゲーションは瞬時に行われます。
			</p>

			<p>
				<a href="https://node.new/sveltekit">StackBlitz で試す</a> か、ローカルにプロジェクトを作成してください。
			</p>
		</div>

		<div slot="how">
			<pre><code
					>npm create <span class="orange-highlight">svelte</span>@latest my-app
cd my-app
npm install
npm run dev -- --open</code
				></pre>
			<a data-sveltekit-preload-data href="/docs" class="cta">get started</a>
		</div>
	</Blurb>
</div>

<style>
	:global(.hero-container:dir(rtl)) {
		max-width: 116rem;
	}

	pre {
		height: 100%;
		display: flex;
		flex-direction: column;
		color: var(--second-text);
	}

	.orange-highlight {
		color: var(--prime);
	}

	.blurb-shifter {
		margin-top: calc(-10rem + var(--side-nav));
	}

	@media (min-width: 900px) {
		.blurb-shifter {
			margin-top: -12em;
		}
	}
</style>
