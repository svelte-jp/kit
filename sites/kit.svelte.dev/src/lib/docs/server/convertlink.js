// 10-getting-started

const docs_introduction = new Map([
	['始める前に', 'Before we begin'],
	['SvelteKitとは', 'What is SvelteKit?']
]);

const docs_creating_a_project = new Map([['エディタのセットアップ', 'Editor setup']]);

const docs_project_structure = new Map([
	['プロジェクトファイル', 'Project files'],
	['その他のファイル', 'Other files']
]);

// 20-core-concepts

const docs_routing = new Map([['その他のファイル', 'Other files']]);

const docs_form_actions = new Map([['action の解剖学', 'Anatomy of an action']]);

const docs_page_options = new Map([['プリレンダリングしない場合', 'When not to prerender']]);

const docs_adapters = new Map([
	['サポートされている環境', 'Supported environments'],
	['プラットフォーム固有の情報', 'Platform-specific context'],
	['コミュニティが提供する adapter', 'Community adapters'],
	['custom adapter を作成する', 'Writing custom adapters']
]);

// 30-advanced

const docs_advanced_routing = new Map([
	['Restパラメータ', 'Rest parameters'],
	['レイアウトグループを使うときは', 'When to use layout groups']
]);

const docs_packaging = new Map([['注意事項', 'Caveats']]);

// 40-best-practices

const docs_accessibility = new Map([['参考文献', 'Further reading']]);

const docs_seo = new Map([
	['パフォーマンス', 'Performance'],
	['URLの正規化', 'Normalized URLs'],
	['&lt;title&gt; と &lt;meta&gt;', '&lt;title&gt; and &lt;meta&gt;'],
	['構造化データ', 'Structured data'],
	['サイトマップ', 'Sitemaps']
]);

// 60-appendix

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

const docs_glossary = new Map([
	['CSR と SPA', 'CSR and SPA'],
	['プリレンダリング', 'Prerendering'],
	['ハイドレーション', 'Hydration'],
	['ルーティング', 'Routing']
]);

// FAQ

const faq = new Map([
	['データベースのセットアップはどう行えばよいですか？', 'How do I setup a database?'],
	['ミドルウェア(middleware)を使うにはどうすればよいですか？', 'How do I use middleware?'],
	[
		'`document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？',
		'How do I use a client-side only library that depends on `document` or `window`?'
	],
	['Yarn を使用するにはどうすれば良いですか？', 'How do I use with Yarn?'],
	['Yarn 2 で動作しますか？', 'Does it work with Yarn 2?'],
	['Yarn 3 を使用するにはどうすれば良いですか？', 'How do I use with Yarn 3?']
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
			// 10-getting-started
			case 'docs/10-getting-started/10-introduction.md':
				return docs_introduction.get(heading) || heading;
			case 'docs/10-getting-started/20-creating-a-project.md':
				return docs_creating_a_project.get(heading) || heading;
			case 'docs/10-getting-started/30-project-structure.md':
				return docs_project_structure.get(heading) || heading;
			// 20-core-concepts
			case 'docs/20-core-concepts/10-routing.md':
				return docs_routing.get(heading) || heading;
			case 'docs/20-core-concepts/30-form-actions.md':
				return docs_form_actions.get(heading) || heading;
			case 'docs/20-core-concepts/40-page-options.md':
				return docs_page_options.get(heading) || heading;
			case 'docs/20-core-concepts/50-adapters.md':
				return docs_adapters.get(heading) || heading;
			// 30-advanced
			case 'docs/30-advanced/10-advanced-routing.md':
				return docs_advanced_routing.get(heading) || heading;
			case 'docs/30-advanced/70-packaging.md':
				return docs_packaging.get(heading) || heading;
			// 40-best-practices
			case 'docs/40-best-practices/10-accessibility.md':
				return docs_accessibility.get(heading) || heading;
			case 'docs/40-best-practices/20-seo.md':
				return docs_seo.get(heading) || heading;
			// 60-appendix
			case 'docs/60-appendix/10-migrating.md':
				return docs_migrating.get(heading) || heading;
			case 'docs/60-appendix/20-additional-resources.md':
				return docs_additional_resources.get(heading) || heading;
			case 'docs/60-appendix/30-glossary.md':
				return docs_glossary.get(heading) || heading;
			default:
				return heading;
		}
	}
}
