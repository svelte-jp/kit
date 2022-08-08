# SvelteKitドキュメント日本語翻訳プロジェクト

[SvelteKit](https://github.com/sveltejs/kit)のドキュメントサイト [kit.svelte.dev](https://kit.svelte.dev/) を日本語に翻訳するプロジェクトです。

**SvelteKit日本語ドキュメントサイト : https://kit.svelte.jp/**

> Svelte本体のドキュメントの日本語化プロジェクトのリポジトリは [svelte-jp/svelte-site-jp](https://github.com/svelte-jp/svelte-site-jp) です。


## 貢献(Contribution)について

この翻訳プロジェクトではみなさんの貢献を歓迎しています！

興味がある方は [CONTRIBUTING_ja.md](https://github.com/svelte-jp/kit/blob/master/CONTRIBUTING_ja.md) をご参照ください。

ご意見や気が付いたことがあれば、お気軽に Issue を作成して知らせてください。  
もしくは [Svelte 日本の Discord](https://discord.com/invite/YTXq3ZtBbx) の `#ドキュメント翻訳`チャンネルに投稿頂いても構いません。


## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/tomoam"><img src="https://avatars.githubusercontent.com/u/29677552?v=4?s=100" width="100px;" alt=""/><br /><sub><b>tomoam</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=tomoam" title="Documentation">📖</a></td>
    <td align="center"><a href="https://yamanoku.net/"><img src="https://avatars.githubusercontent.com/u/1996642?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Okuto Oyama</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=yamanoku" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/myLifeAsaDog"><img src="https://avatars.githubusercontent.com/u/18300178?v=4?s=100" width="100px;" alt=""/><br /><sub><b>myLifeAsaDog</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=myLifeAsaDog" title="Documentation">📖</a></td>
    <td align="center"><a href="https://katanugramer.hatenablog.com/"><img src="https://avatars.githubusercontent.com/u/42486288?v=4?s=100" width="100px;" alt=""/><br /><sub><b>miruoo</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=miily8310s" title="Documentation">📖</a></td>
    <td align="center"><a href="https://qiita.com/oekazuma"><img src="https://avatars.githubusercontent.com/u/29580221?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kazuma Oe</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=oekazuma" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/dajiaji"><img src="https://avatars.githubusercontent.com/u/3192030?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ajitomi Daisuke</b></sub></a><br /><a href="https://github.com/svelte-jp/kit/commits?author=dajiaji" title="Documentation">📖</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!


以下は sveltejs/kit のREADMEの内容です。

---

[![Chat](https://img.shields.io/discord/457912077277855764?label=chat&logo=discord)](https://svelte.dev/chat)

# READ THIS FIRST!

SvelteKit is still in beta. Expect bugs! Read more [here](https://svelte.dev/blog/sveltekit-beta), and track progress towards 1.0 [here](https://github.com/sveltejs/kit/issues?q=is%3Aopen+is%3Aissue+milestone%3A1.0).

## Overview

The Fastest Way to Build Svelte Apps

- 💨 Blazing-Fast Production Sites
- 🛠️ SSR, SPA, SSG, and In-Between
- ⚡️ Instantly Visible Code Changes
- 🔩 Existing Universe of Plugins
- 🔑 Fully Typed APIs

## Documentation

Please see [the documentation](https://kit.svelte.dev/docs) for information about getting started and developing with SvelteKit.

### Packages

| Package                                                                     | Changelog                                                     |
| --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [@sveltejs/kit](packages/kit)                                               | [Changelog](packages/kit/CHANGELOG.md)                        |
| [create-svelte](packages/create-svelte)                                     | [Changelog](packages/create-svelte/CHANGELOG.md)              |
| [@sveltejs/adapter-node](packages/adapter-node)                             | [Changelog](packages/adapter-node/CHANGELOG.md)               |
| [@sveltejs/adapter-static](packages/adapter-static)                         | [Changelog](packages/adapter-static/CHANGELOG.md)             |
| [@sveltejs/adapter-cloudflare-workers](packages/adapter-cloudflare-workers) | [Changelog](packages/adapter-cloudflare-workers/CHANGELOG.md) |
| [@sveltejs/adapter-cloudflare](packages/adapter-cloudflare)                 | [Changelog](packages/adapter-cloudflare/CHANGELOG.md)         |
| [@sveltejs/adapter-netlify](packages/adapter-netlify)                       | [Changelog](packages/adapter-netlify/CHANGELOG.md)            |
| [@sveltejs/adapter-vercel](packages/adapter-vercel)                         | [Changelog](packages/adapter-vercel/CHANGELOG.md)             |

The SvelteKit community also makes additional [SvelteKit adapters available for use](https://sveltesociety.dev/components#adapters).

### Migrating from Sapper

Check out the [Migration Guide](https://kit.svelte.dev/docs/migrating) if you are upgrading from Sapper.

## Bug reporting

Please make sure the issue you're reporting involves SvelteKit. Many issues related to how a project builds originate from [Vite](https://vitejs.dev/), which is used to build a SvelteKit project. It's important to note that new Vite projects don't use SSR by default, and so if you create a new Vite project from scratch, many issues won't reproduce. You should thus start with a project that utilizes SSR, such as `npm create vite-extra@latest -- --template ssr-svelte`.

If an issue originates from Vite, please report in the [Vite issue tracker](https://github.com/vitejs/vite/issues).

## Changing SvelteKit locally

See the [Contributing Guide](./CONTRIBUTING.md).

## Supporting Svelte

Svelte is an MIT-licensed open source project with its ongoing development made possible entirely by fantastic volunteers. If you'd like to support their efforts, please consider:

- [Becoming a backer on Open Collective](https://opencollective.com/svelte).

Funds donated via Open Collective will be used for compensating expenses related to Svelte's development such as hosting costs. If sufficient donations are received, funds may also be used to support Svelte's development more directly.

## License

[MIT](https://github.com/sveltejs/kit/blob/master/LICENSE)
