import { modules } from '$lib/generated/type-info.js';
import { pages } from '$lib/server/docs/index.js';
import {
	markedTransform,
	replaceExportTypePlaceholders,
	slugify
} from '@sveltejs/site-kit/markdown';

const categories = [
	{
		slug: 'docs',
		label: null,
		href: (parts) =>
			parts.length > 1 ? `/docs/${parts[0]}#${parts.slice(1).join('-')}` : `/docs/${parts[0]}`
	}
];

export async function content() {
	/** @type {import('@sveltejs/site-kit/search').Block[]} */
	const blocks = [];

	for (const category of categories) {
		const breadcrumbs = category.label ? [category.label] : [];

		for (const [slug, page] of Object.entries(pages)) {
			const body = await replaceExportTypePlaceholders(page.body, modules);

			const sections = body.trim().split(/^## /m);
			const intro = sections.shift().trim();
			const rank = page.rank;

			blocks.push({
				breadcrumbs: [...breadcrumbs, page.title],
				href: category.href([slug]),
				content: await plaintext(intro),
				rank
			});

			const headingRegex = /(.*?)(?:\s(<!--(.*?)-->))?$/;

			for (const section of sections) {
				const lines = section.split('\n');
				const h3 = lines.shift();
				const h3match = headingRegex.exec(h3);
				const h3text = h3match[1] || h3;
				const h3slug = h3match[3] || slugify(h3);
				const content = lines.join('\n');

				const subsections = content.trim().split('### ');

				const intro = subsections.shift().trim();

				blocks.push({
					breadcrumbs: [...breadcrumbs, page.title, h3text],
					href: category.href([slug, h3slug]),
					content: await plaintext(intro),
					rank
				});

				for (const subsection of subsections) {
					const lines = subsection.split('\n');
					const h4 = lines.shift();
					const h4match = headingRegex.exec(h4);
					const h4text = h4match[1] || h4;
					const h4slug = h4match[3] || slugify(h4);

					blocks.push({
						breadcrumbs: [...breadcrumbs, page.title, h3text, h4text],
						href: category.href([slug, h3slug, h4slug]),
						content: await plaintext(lines.join('\n').trim()),
						rank
					});
				}
			}
		}
	}

	return blocks;
}

/** @param {string} markdown  */
async function plaintext(markdown) {
	const block = (text) => `${text}\n`;
	const inline = (text) => text;

	return (
		await markedTransform(markdown, {
			code: (source) =>
				source
					.split('// ---cut---\n')
					.pop()
					.replace(/^\/\/((\/ file:)|( @errors:))[\s\S]*/gm, ''),
			blockquote: block,
			html: () => '\n',
			heading: (text) => `${text}\n`,
			hr: () => '',
			list: block,
			listitem: block,
			checkbox: block,
			paragraph: (text) => `${text}\n\n`,
			table: block,
			tablerow: block,
			tablecell: (text, opts) => {
				return text + ' ';
			},
			strong: inline,
			em: inline,
			codespan: inline,
			br: () => '',
			del: inline,
			link: (href, title, text) => text,
			image: (href, title, text) => text,
			text: inline
		})
	)
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#(\d+);/g, (match, code) => {
			return String.fromCharCode(code);
		})
		.trim();
}
