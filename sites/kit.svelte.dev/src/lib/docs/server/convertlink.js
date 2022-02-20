const docs_introduction = new Map([
	['始める前に', 'Before we begin'],
	['SvelteKitとは', 'What is SvelteKit?'],
	['エディターのセットアップ', 'Editor setup']
]);

const docs_routing = new Map([
	['プライベートモジュール', 'Private modules'],
	['高度なルーティング', 'Advanced routing'],
	['Restパラメータ', 'Rest parameters'],
	['ソート', 'Sorting'],
	['フォールスルールート', 'Fallthrough routes']
]);

const docs_layouts = new Map([
	['ネストレイアウト', 'Nested layouts'],
	['リセット', 'Resets'],
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
	['`title` と `meta`', '`title` and `meta`'],
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
 * @param {string} title
 * @param {string} heading
 */
export function convert_link(label, title, heading) {
	if (label) {
		return faq.get(heading) || heading;
	} else {
		switch (title) {
			case 'Introduction':
				return docs_introduction.get(heading) || heading;
			case 'ルーティング':
				return docs_routing.get(heading) || heading;
			case 'レイアウト':
				return docs_layouts.get(heading) || heading;
			case 'Adapters':
				return docs_adapters.get(heading) || heading;
			case 'Page options':
				return docs_page_options.get(heading) || heading;
			case 'Packaging':
				return docs_packaging.get(heading) || heading;
			case 'SEO':
				return docs_seo.get(heading) || heading;
			case 'アセットハンドリング':
				return docs_assets.get(heading) || heading;
			case 'Sapper からの移行':
				return docs_migrating.get(heading) || heading;
			case 'Additional Resources':
				return docs_additional_resources.get(heading) || heading;
			case 'Appendix':
				return docs_appendix.get(heading) || heading;
			default:
				return heading;
		}
	}
}
