import { Server } from 'SERVER';
import { manifest, prerendered } from 'MANIFEST';
import * as Cache from 'worktop/cfw.cache';

const server = new Server(manifest);

const app_path = `/${manifest.appPath}/`;

/** @type {import('worktop/cfw').Module.Worker<{ ASSETS: import('worktop/cfw.durable').Durable.Object }>} */
const worker = {
	async fetch(req, env, context) {
		// @ts-ignore
		await server.init({ env });
		// skip cache if "cache-control: no-cache" in request
		let pragma = req.headers.get('cache-control') || '';
		let res = !pragma.includes('no-cache') && (await Cache.lookup(req));
		if (res) return res;

		let { pathname } = new URL(req.url);

		// generated files
		if (pathname.startsWith(app_path)) {
			res = await env.ASSETS.fetch(req);
			if (!res.ok) return res;

			const cache_control = pathname.startsWith(app_path + 'immutable/')
				? 'public, immutable, max-age=31536000'
				: 'no-cache';

			res = new Response(res.body, {
				headers: {
					// include original headers, minus cache-control which
					// is overridden, and etag which is no longer useful
					'cache-control': cache_control,
					'content-type': res.headers.get('content-type'),
					'x-robots-tag': 'noindex'
				}
			});
		} else {
			// prerendered pages and /static files

			try {
				pathname = decodeURIComponent(pathname);
			} catch {
				// ignore invalid URI
			}

			const stripped_pathname = pathname.replace(/\/$/, '');

			let is_static_asset = false;
			const filename = stripped_pathname.substring(1);
			if (filename) {
				is_static_asset =
					manifest.assets.has(filename) || manifest.assets.has(filename + '/index.html');
			}

			const counterpart_route = pathname.at(-1) === '/' ? stripped_pathname : pathname + '/';

			if (is_static_asset || prerendered.has(pathname)) {
				res = await env.ASSETS.fetch(req);
			} else if (counterpart_route && prerendered.has(counterpart_route)) {
				res = new Response('', {
					status: 308,
					headers: {
						location: counterpart_route
					}
				});
			} else {
				// dynamically-generated pages
				res = await server.respond(req, {
					// @ts-ignore
					platform: { env, context, caches },
					getClientAddress() {
						return req.headers.get('cf-connecting-ip');
					}
				});
			}
		}

		// Writes to Cache only if allowed & specified
		pragma = res.headers.get('cache-control');
		return pragma && res.ok ? Cache.save(req, res, context) : res;
	}
};

export default worker;
