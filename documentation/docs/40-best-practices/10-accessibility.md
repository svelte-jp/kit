---
title: Accessibility
---

SvelteKit は、アプリにアクセシブルなプラットフォームをデフォルトで提供するよう努めています。Svelte の [コンパイル時のアクセシビリティチェック(compile-time accessibility checks)](https://svelte.jp/docs#accessibility-warnings) は、あなたがビルドする SvelteKit アプリケーションにも適用されます。

ここでは、SvelteKit の組み込みのアクセシビリティ(accessibility)機能がどのように動作するか、そしてこれらの機能が可能な限りうまく動作するようにするために必要なことについて説明します。SvelteKit はアクセシブルな基盤を提供しますが、アプリケーションのコードをアクセシブルにするのはあなたの責任であることを覚えておいてください。もし、アクセシビリティ(accessibility)についてよく知らないのであれば、このガイドの ["参考文献"](accessibility#further-reading) セクションで、その他のリソースを参照してください。

私たちは、アクセシビリティ(accessibility)を正しく行うのは難しいことだと認識しています。SvelteKit のアクセシビリティ対応について改善を提案したい方は、[GitHub issue を作成](https://github.com/sveltejs/kit/issues) してください。

## Route announcements

旧来のサーバーレンダリングアプリケーションでは、全てのナビゲーション (例えば、`<a>` タグをクリックするなど) で、ページのフルリロードを引き起こします。これが起こると、スクリーンリーダーやその他の支援技術が新しいページのタイトルを読み上げ、それによってユーザーはページが変更されたことを理解します。

SvelteKit では、ページ間のナビゲーションではページのリロードが発生しないため ([クライアントサイドルーティング](glossary#routing)として知られる)、SvelteKit はナビゲーションごとに新しいページ名が読み上げられるように[ライブリージョン](https://developer.mozilla.org/ja/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)をページに注入します。これは、`<title>` 要素を検査することで、アナウンスするページ名を決定します。

この動作のために、アプリの全ページにユニークで説明的なタイトルを付けるべきです。SvelteKit では、各ページに `<svelte:head>` 要素を配置することでこれを行うことができます:

```svelte
<!--- file: src/routes/+page.svelte --->
<svelte:head>
	<title>Todo List</title>
</svelte:head>
```

これにより、スクリーンリーダーやその他の支援技術が、ナビゲーション後に新しいページを識別することができるようになります。説明的なタイトルを提供することは、[SEO](seo#manual-setup-title-and-meta) にとっても重要なことです。

## フォーカス管理(Focus management)

旧来のサーバーレンダリングアプリケーションでは、ナビゲーションでフォーカスがページのトップにリセットされます。これによって、キーボードやスクリーンリーダーを使用して web をブラウジングする方が、ページの先頭からやり取りできるようになります。

クライアントサイドルーティング中にこの挙動をシミュレートするために、SvelteKit は各ナビゲーションや [強化されたフォーム送信(enhanced form submission)](https://kit.svelte.jp/docs/form-actions#progressive-enhancement) の後、`<body>` 要素にフォーカスを合わせます。1つ例外があります - [`autofocus`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus) 属性が付いている要素が存在する場合、SvelteKit はその要素にフォーカスを合わせます。この属性を使用するときは、[支援技術(assistive technology)に対する影響を必ず考慮](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/autofocus#accessibility_considerations)してください。

SvelteKit のフォーカス管理をカスタマイズしたい場合は、`afterNavigate` hook を使います:

```js
/// <reference types="@sveltejs/kit" />
// ---cut---
import { afterNavigate } from '$app/navigation';

afterNavigate(() => {
	/** @type {HTMLElement | null} */
	const to_focus = document.querySelector('.focus-me');
	to_focus?.focus();
});
```

[`goto`](modules#$app-navigation-goto) 関数を使用して、プログラムで別のページにナビゲーションさせることもできます。デフォルトでは、これはクライアントサイドルーティングでリンクをクリックするのと同じ動作です。しかし `goto` は、`keepFocus` オプション を受け付けます。このオプションは、フォーカスをリセットする代わりに、現在フォーカスされている要素にフォーカスを保持したままにします。このオプションを有効にする場合は、現在フォーカスされている要素がナビゲーション後にもまだ存在することを確かめてください。もしその要素が存在しなければ、ユーザーのフォーカスは失われ、支援技術のユーザーにとって混乱した体験になります。

## The "lang" attribute

デフォルトでは、SvelteKit のページテンプレートには、ドキュメントのデフォルト言語に英語が設定されています。もしコンテンツが英語でない場合、`src/app.html` の `<html>` 要素を更新し、正しい [`lang`](https://developer.mozilla.org/ja/docs/Web/HTML/Global_attributes/lang#accessibility) 属性を持たせる必要があります。これによって、ドキュメントを読む支援技術が正しい発音を使えるようになります。例えば、コンテンツがドイツ語の場合、`app.html` を以下のように更新してください:

```html
/// file: src/app.html
<html lang="de">
```

コンテンツが複数の言語で使用可能な場合、開いているページの言語に基づいて `lang` 属性を設定できるようにする必要があります。これは、SvelteKit の [handle hook](hooks#server-hooks-handle) を使用して行うことができます:

```html
/// file: src/app.html
<html lang="%lang%">
```

```js
/// file: src/hooks.server.js
/**
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
function get_lang(event) {
	return 'en';
}
// ---cut---
/** @type {import('@sveltejs/kit').Handle} */
export function handle({ event, resolve }) {
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', get_lang(event))
	});
}
```

## その他の参考情報 <!--further-reading-->

ほとんどの場合、アクセシブルな SvelteKit アプリを構築するのはアクセシブルな Web アプリを構築するのと同じです。以下の一般的なアクセシビリティ(accessibility)に関するリソースから得られる情報は、どんな Web エクスペリエンスを構築する場合でも適用できるはずです

- [MDN Web Docs: Accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility)
- [The A11y Project](https://www.a11yproject.com/)
- [How to Meet WCAG (Quick Reference)](https://www.w3.org/WAI/WCAG21/quickref/)
