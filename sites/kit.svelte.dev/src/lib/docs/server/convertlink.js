// 10-getting-started

const docs_introduction = new Map([
	['始める前に', 'Before we begin'],
	['SvelteKitとは', 'What is SvelteKit?'],
	['Svelteとは', 'What is Svelte?'],
	['SvelteKit は Svelte 上で何を提供するのか', 'What does SvelteKit provide on top of Svelte?']
]);

const docs_creating_a_project = new Map([['エディタのセットアップ', 'Editor setup']]);

const docs_project_structure = new Map([
	['プロジェクトファイル', 'Project files'],
	['その他のファイル', 'Other files']
]);

// 20-core-concepts

const docs_routing = new Map([['その他のファイル', 'Other files']]);

const docs_load = new Map([
	['どちらを使用すべきか', 'When to use which'],
	['URL data を使用する', 'Using URL data'],
	['fetch リクエストの作成', 'Making fetch requests']
]);

const docs_form_actions = new Map([['action の解剖学', 'Anatomy of an action']]);

const docs_page_options = new Map([['プリレンダリングしない場合', 'When not to prerender']]);

// 25-build-and-deploy

const docs_building_your_app = new Map([
	['ビルド中に', 'During the build'],
	['アプリのプレビュー', 'Preview your app']
]);

const docs_adapters = new Map([
	['adapter を使用する', 'Using adapters'],
	['プラットフォーム固有の情報', 'Platform-specific context']
]);

const docs_adapter_auto = new Map([
	['環境固有の設定', 'Environment-specific configuration'],
	['コミュニティ adapter の追加', 'Adding community adapters']
]);

const docs_adapter_node = new Map([
	['使い方', 'Usage'],
	['環境変数', 'Environment variables'],
	['`PORT` と `HOST`', '`PORT` and `HOST`'],
	['`ORIGIN`、`PROTOCOL_HEADER`、`HOST_HEADER`', '`ORIGIN`, `PROTOCOL_HEADER` and `HOST_HEADER`'],
	['`ADDRESS_HEADER` と `XFF_DEPTH`', '`ADDRESS_HEADER` and `XFF_DEPTH`'],
	['カスタムサーバー', 'Custom server'],
	['トラブルシューティング', 'Troubleshooting'],
	[
		'サーバーが終了する前にクリーンアップするための hook はありますか？',
		'Is there a hook for cleaning up before the server exits?'
	]
]);

const docs_adapter_static = new Map([
	['使い方', 'Usage'],
	['ゼロコンフィグサポート', 'Zero-config support'],
	['SPA モード', 'SPA mode'],
	['フォールバックページ(fallback page)を追加する', 'Add fallback page'],
	['プリレンダリングをオフにする', 'Turn off prerendering'],
	['ssr をオフにする', 'Turn off ssr']
]);

const docs_adapter_cloudflare = new Map([
	['比較', 'Comparisons'],
	['使い方', 'Usage'],
	['環境変数', 'Environment variables'],
	['トラブルシューティング', 'Troubleshooting'],
	['ファイルシステムにアクセスする', 'Accessing the file system']
]);

const docs_adapter_cloudflare_workers = new Map([
	['使い方', 'Usage'],
	['基本設定', 'Basic Configuration'],
	['カスタム設定', 'Custom config'],
	['環境変数', 'Environment variables'],
	['トラブルシューティング', 'Troubleshooting'],
	['ファイルシステムにアクセスする', 'Accessing the file system']
]);

const docs_adapter_netlify = new Map([
	['使い方', 'Usage'],
	['SvelteKit の機能を代替する Netlify の機能', 'Netlify alternatives to SvelteKit functionality'],
	['トラブルシューティング', 'Troubleshooting'],
	['ファイルシステムにアクセスする', 'Accessing the file system']
]);

// 30-advanced

const docs_advanced_routing = new Map([
	['Restパラメータ', 'Rest parameters'],
	['レイアウトグループを使うときは', 'When to use layout groups']
]);

const docs_service_workers = new Map([
	['service worker の内部では', 'Inside the service worker'],
	['その他のソリューション', 'Other solutions']
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
	[
		'package.json の詳細をアプリケーションに含めるにはどうすればよいですか？',
		'How do I include details from package.json in my application?'
	],
	[
		'`document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？',
		'How do I use a client-side only library that depends on `document` or `window`?'
	],
	[
		'別のバックエンド API サーバーを使用するにはどうすれば良いですか？',
		'How do I use a different backend API server?'
	],
	['ミドルウェア(middleware)を使うにはどうすればよいですか？', 'How do I use middleware?'],
	['Yarn 2 で動作しますか？', 'Does it work with Yarn 2?'],
	['Yarn 3 を使用するにはどうすれば良いですか？', 'How do I use with Yarn 3?']
]);

/**
 * @param {string} file
 * @param {string} heading
 */
export function convert_link(file, heading) {
	if (file.startsWith('faq')) {
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
			case 'docs/20-core-concepts/20-load.md':
				return docs_load.get(heading) || heading;
			case 'docs/20-core-concepts/30-form-actions.md':
				return docs_form_actions.get(heading) || heading;
			case 'docs/20-core-concepts/40-page-options.md':
				return docs_page_options.get(heading) || heading;
			// 25-build-and-deploy
			case 'docs/25-build-and-deploy/10-building-your-app.md':
				return docs_building_your_app.get(heading) || heading;
			case 'docs/25-build-and-deploy/20-adapters.md':
				return docs_adapters.get(heading) || heading;
			case 'docs/25-build-and-deploy/30-adapter-auto.md':
				return docs_adapter_auto.get(heading) || heading;
			case 'docs/25-build-and-deploy/40-adapter-node.md':
				return docs_adapter_node.get(heading) || heading;
			case 'docs/25-build-and-deploy/50-adapter-static.md':
				return docs_adapter_static.get(heading) || heading;
			case 'docs/25-build-and-deploy/60-adapter-cloudflare.md':
				return docs_adapter_cloudflare.get(heading) || heading;
			case 'docs/25-build-and-deploy/70-adapter-cloudflare-workers.md':
				return docs_adapter_cloudflare_workers.get(heading) || heading;
			case 'docs/25-build-and-deploy/80-adapter-netlify.md':
				return docs_adapter_netlify.get(heading) || heading;
			// 30-advanced
			case 'docs/30-advanced/10-advanced-routing.md':
				return docs_advanced_routing.get(heading) || heading;
			case 'docs/30-advanced/40-service-workers.md':
				return docs_service_workers.get(heading) || heading;
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
