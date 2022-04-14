const docs_introduction = new Map([
	['始める前に', 'Before we begin'],
	['SvelteKitとは', 'What is SvelteKit?'],
	['エディターのセットアップ', 'Editor setup']
]);

const docs_routing = new Map([
	['プライベートモジュール', 'Private modules'],
	['高度なルーティング', 'Advanced routing'],
	['Restパラメータ', 'Rest parameters'],
	['ソート', 'Sorting']
]);

const docs_layouts = new Map([
	['エラーページ', 'Error pages']
]);

const docs_adapters = new Map([
	['サポートされている環境', 'Supported environments'],
	['プラットフォーム固有の情報', 'Platform-specific context'],
	['コミュニティが提供するadapter', 'Community adapters'],
	['custom adapterを作成する', 'Writing custom adapters']
]);

const docs_packaging = new Map([['注意事項', 'Caveats']]);

const docs_page_options = new Map([['プリレンダリングしない場合', 'When not to prerender']]);

const docs_seo = new Map([
	['パフォーマンス', 'Performance'],
	['URLの正規化', 'Normalized URLs'],
	['&lt;title&gt; と &lt;meta&gt;', '&lt;title&gt; and &lt;meta&gt;'],
	['構造化データ', 'Structured data'],
	['サイトマップ', 'Sitemaps']
]);

const docs_assets = new Map([
	['ハッシュ化', 'Hashing'],
	['最適化', 'Optimization']
]);

const docs_migrating = new Map([
	['プロジェクトファイル', 'Project files'],
	['ページとレイアウト', 'Pages and layouts'],
	['名前が変わったファイル', 'Renamed files'],
	['ルーティング', 'Routing'],
	['インテグレーション', 'Integrations']
]);

const docs_additional_resources = new Map([
	['インテグレーション', 'Integrations'],
	['サポート', 'Support']
]);

const docs_appendix = new Map([
	['CSR と SPA', 'CSR and SPA'],
	['プリレンダリング', 'Prerendering'],
	['ハイドレーション', 'Hydration'],
	['ルーティング', 'Routing']
]);

const faq = new Map([
	['データベースのセットアップはどう行えばよいですか？', 'How do I setup a database?'],
	['ミドルウェア(middleware)を使うにはどうすればよいですか？', 'How do I use middleware?'],
	[
		'`document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？',
		'How do I use a client-side only library that depends on `document` or `window`?'
	],
	['Yarn 2 で動作しますか？', 'Does it work with Yarn 2?']
]);

/**
 * @param {string | undefined} label
 * @param {string} file
 * @param {string} heading
 */
export function convert_link(label, file, heading) {
	if (label) {
		return faq.get(heading) || heading;
	} else {
		switch (file) {
			case '00-introduction.md':
				return docs_introduction.get(heading) || heading;
			case '01-routing.md':
				return docs_routing.get(heading) || heading;
			case '02-layouts.md':
				return docs_layouts.get(heading) || heading;
			case '09-adapters.md':
				return docs_adapters.get(heading) || heading;
			case '10-page-options.md':
				return docs_page_options.get(heading) || heading;
			case '11-packaging.md':
				return docs_packaging.get(heading) || heading;
			case '15-seo.md':
				return docs_seo.get(heading) || heading;
			case '16-assets.md':
				return docs_assets.get(heading) || heading;
			case '80-migrating.md':
				return docs_migrating.get(heading) || heading;
			case '90-additional-resources.md':
				return docs_additional_resources.get(heading) || heading;
			case '99-appendix.md':
				return docs_appendix.get(heading) || heading;
			default:
				return heading;
		}
	}
}
