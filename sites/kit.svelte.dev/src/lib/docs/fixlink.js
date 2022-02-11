const map = new Map([
	['始める前に', 'Before we begin'],
	['SvelteKitとは', 'What is SvelteKit?'],
	['エディターのセットアップ', 'Editor setup'],
	['プリレンダリングしない場合', 'When not to prerender'],
	['データベースのセットアップはどう行えばよいですか？', 'How do I setup a database?'],
	['ミドルウェア(middleware)を使うにはどうすればよいですか？', 'How do I use middleware?'],
	[
		'`document` や `window` に依存しているクライアントサイドオンリーなライブラリはどう使えばよいですか？',
		'How do I use a client-side only library that depends on `document` or `window`?'
	],
	['Yarn 2 で動作しますか？', 'Does it work with Yarn 2?']
]);

/**
 * @param {string} heading
 */
export function convert_heading(heading) {
	return map.get(heading) || heading;
}
