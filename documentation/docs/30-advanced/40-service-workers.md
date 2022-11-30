---
title: Service workers
---

Service Worker は、アプリ内部でネットワークリクエストを処理するプロキシサーバーとして機能します。これによりアプリをオフラインで動作させることが可能になります。もしオフラインサポートが不要な場合（または構築するアプリの種類によって現実的に実装できない場合）でも、ビルドした JS と CSS を事前にキャッシュしてナビゲーションを高速化するために Service Worker を使用する価値はあります。

SvelteKit では、`src/service-worker.js` ファイル (または `src/service-worker.ts` や `src/service-worker/index.js` など) がある場合、バンドルされ、自動的に登録されます。必要に応じて、[service worker の ロケーション](/docs/configuration#files) を変更することができます。 

service worker を独自のロジックで登録する必要がある場合や、その他のソリューションを使う場合は、[自動登録を無効化](/docs/configuration#serviceworker) することができます。デフォルトの登録方法は次のようなものです:

```js
if ('serviceWorker' in navigator) {
	addEventListener('load', function () {
		navigator.serviceWorker.register('./path/to/service-worker.js');
	});
}
```

service worker の内部では、[`$service-worker` モジュール](/docs/modules#$service-worker) にアクセスでき、これによって全ての静的なアセット、ビルドファイル、プリレンダリングページへのパスが提供されます。また、アプリのバージョン文字列の提供され、一意なキャッシュ名を作成するのに使用することができます。Vite の設定に `define` (グローバル変数の置換に使用) を指定している場合、それはサーバー/クライアントのビルドだけでなく、service worker にも適用されます。

次の例では、ビルドされたアプリと `static` にあるファイルをすぐに(eagerly)キャッシュし、その他全てのリクエストはそれらの発生時にキャッシュします。これにより、各ページは一度アクセスするとオフラインで動作するようになります。

```js
// @ts-nocheck Official TS Service Worker typings are still a work in progress.
import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

const ASSETS = [
	...build, // the app itself
	...files  // everything in `static`
];

self.addEventListener('install', (event) => {
	// Create a new cache and add all files to it
	async function addFilesToCache() {
		const cache = await caches.open(CACHE);
		await cache.addAll(ASSETS);
	}

	event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
	// Remove previous cached data from disk
	async function deleteOldCaches() {
		for (const key of await caches.keys()) {
			if (key !== CACHE) await caches.delete(key);
		}
	}

	event.waitUntil(deleteOldCaches());
});

self.addEventListener('fetch', (event) => {
	// ignore POST requests etc
	if (event.request.method !== 'GET') return;

	async function respond() {
		const url = new URL(event.request.url);
		const cache = await caches.open(CACHE);

		// `build`/`files` can always be served from the cache
		if (ASSETS.includes(url.pathname)) {
			return cache.match(event.request);
		}

		// for everything else, try the network first, but
		// fall back to the cache if we're offline
		try {
			const response = await fetch(event.request);

			if (response.status === 200) {
				cache.put(response.clone());
			}

			return response;
		} catch {
			return cache.match(event.request);
		}
	}

	event.respondWith(respond());
});
```

> キャッシュにはご注意ください！ 場合によっては、オフラインでは利用できないデータよりも古くなったデータのほうが悪いことがあります。ブラウザはキャッシュが一杯になると空にするため、ビデオファイルのような大きなアセットをキャッシュする場合にもご注意ください。

service worker はプロダクション向けにはバンドルされますが、開発中はバンドルされません。そのため、[modules in service workers](https://web.dev/es-modules-in-sw) をサポートするブラウザのみ、開発時にもそれを使用することができます。service worker を手動で登録する場合、開発時に `{ type: 'module' }` オプションを渡す必要があります:

```js
import { dev } from '$app/environment';

navigator.serviceWorker.register('/service-worker.js', {
	type: dev ? 'module' : 'classic'
});
```

> `build` と `prerendered` は開発中は空配列です

SvelteKit の service worker 実装は意図的に低レベル(low-level)です。より本格的な、よりこだわりが強い(opinionated)ソリューションが必要な場合は、[Vite PWA plugin](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html) のようなソリューションをご覧になることをおすすめしております、こちらは [Workbox](https://web.dev/learn/pwa/workbox) を使用しています。service worker に関する一般的な情報をもっとお探しであれば、[MDN web docs](https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API/Using_Service_Workers) をおすすめします。
