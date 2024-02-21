---
title: ゼロコンフィグデプロイ
---

`npm create svelte@latest` で新しい SvelteKit プロジェクトを作成した場合、デフォルトで [`adapter-auto`](https://github.com/sveltejs/kit/tree/main/packages/adapter-auto) がインストールされます。この adapter はデプロイ時にサポートされている環境に合った adapter を自動でインストールします:

- [`@sveltejs/adapter-cloudflare`](adapter-cloudflare) for [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [`@sveltejs/adapter-netlify`](adapter-netlify) for [Netlify](https://netlify.com/)
- [`@sveltejs/adapter-vercel`](adapter-vercel) for [Vercel](https://vercel.com/)
- [`svelte-adapter-azure-swa`](https://github.com/geoffrich/svelte-adapter-azure-swa) for [Azure Static Web Apps](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [`svelte-kit-sst`](https://github.com/sst/sst/tree/master/packages/svelte-kit-sst) for [AWS via SST](https://docs.sst.dev/start/svelte)

デプロイするターゲットの環境が決まったら、`devDependencies` に適切な adapter をインストールすることを推奨します。これにより、lockfile に adapter が追加されるため、CI でのインストール時間が少し改善されます。

## 環境固有の設定 <!--environment-specific-configuration-->

[`adapter-vercel`](adapter-vercel) や [`adapter-netlify`](adapter-netlify) の `{ edge: true }` のような設定オプションを追加したければ、そのオプションを持つ adapter をインストールしなければなりません。`adapter-auto` はそれらのオプションを受け付けません。

## コミュニティ adapter を追加する <!--adding-community-adapters-->

追加の adapter 向けのゼロコンフィグサポートを追加するには、[adapters.js](https://github.com/sveltejs/kit/blob/main/packages/adapter-auto/adapters.js) を編集し、pull request を開きます。
