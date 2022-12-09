<script>
	import Section from '@sveltejs/site-kit/components/Section.svelte';
	import Video from './Video.svelte';
</script>

<Section --background="var(--background-1)">
	<p class="definition">
		<em>/ˈsvɛlt/</em> <span class="adjective">形容詞</span>
		<span class="description">魅力的でスリム、洗練されていてスタイリッシュ</span>
	</p>

	<div class="grid" style="--columns: 3">
		<div class="video-container">
			<Video />

			<p>
				<a
					target="_blank"
					rel="noreferrer"
					href="https://www.offerzen.com/community/svelte-origins-documentary"
				>
					Svelte Origins ドキュメンタリーをフルで視聴する
				</a>
			</p>
		</div>

		<div>
			<p>
				SvelteKit は Svelte 上に構築されています。Svelte はコンパイラを使用する UI フレームワークで、息を呑むほど簡潔にコンポーネントを書くことができ、
				ブラウザで最小限の動作となるようにしてくれます。
				開発者は既知の言語(HTML、CSS、JavaScript)を使うことができます。 <strong style="color: var(--sk-theme-2)"
					>これは、web 開発へのラブレターです。</strong
				>
			</p>

			<p>
				私たちが主張しているだけだと思わないでください。Svelte は、開発者が
				<a
					target="_blank"
					rel="noreferrer"
					href="https://insights.stackoverflow.com/survey/2021#section-most-loved-dreaded-and-wanted-web-frameworks"
				>
					最も
				</a>
				<a
					target="_blank"
					rel="noreferrer"
					href="https://tsh.io/state-of-frontend/#which-of-the-following-frameworks-would-you-like-to-learn-in-the-future"
				>
					使用
				</a>
				<a
					target="_blank"
					rel="noreferrer"
					href="https://2021.stateofjs.com/en-US/libraries/front-end-frameworks/"
				>
					したいと
				</a>

				<a
					target="_blank"
					rel="noreferrer"
					href="https://twitter.com/Rich_Harris/status/1589675637195042817"
				>
					考えている</a
				>フレームワークとして、常に上位にランクしています。
			</p>
		</div>
	</div>
</Section>

<style>
	p {
		font-size: var(--sk-text-s);
	}

	.definition {
		font-size: var(--sk-text-l);
	}

	.definition em {
		font-style: normal;
		font-size: var(--sk-text-xxl);
		color: var(--sk-theme-1);
	}

	.definition .adjective {
		position: relative;
		top: -0.15em;
		padding: 0.25em 0.5em 0.1em;
		line-height: 1;
		margin: 0 1em;
		text-transform: uppercase;
		font-size: var(--sk-text-s);
		background: var(--sk-text-2);
		border-radius: var(--sk-border-radius);
		color: var(--sk-back-2);
	}

	.definition .description {
		display: block;
	}

	@media (min-width: 900px) {
		.definition .description {
			display: inline;
		}

		.video-container {
			order: 2;
			grid-column: 2 / 4;
		}
	}
</style>
