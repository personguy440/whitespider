/// <reference lib="WebWorker" />
"use strict"; ((_) => {
	/**
	 * @type {ServiceWorkerGlobalScope}
	 */
	const self = _;
	const origin = self.location.origin;
	const cacheName = "167e1f07-b59a-4742-bb45-15cf3caabcce";

	/**
	 * @param {FetchEvent} e 
	 * @returns {Promise<Response>}
	 */
	async function handleFetch(e) {
		const request = e.request;
		switch (request.method) {
			case "GET":
			case "HEAD":
				break;
			default:
				return await fetch(request);
		}

		const url = new URL(request.url);
		switch (url.protocol) {
			case "http:":
			case "https:":
				break;
			default:
				return await fetch(request);
		}

		if (url.origin === origin && url.pathname === "/manifest.json") {
			return await fetch(url, {
				body: null,
				mode: "same-origin",
				cache: "no-cache",
				method: request.method,
				headers: request.headers
			});
		}

		const res = await caches.match(request, { cacheName }) || await e.preloadResponse || await fetch(request);
		if (origin !== "http://localhost:8000") {
			try {
				await (await caches.open(cacheName)).put(request, res.clone());
			} catch (err) {
				// ignore
			}
		}
		return res;
	}

	/**
	 * @param {ExtendableMessageEvent} e 
	 */
	async function handleMessage(e) {
	}

	/**
	 * @param {ExtendableEvent} e 
	 */
	async function handleInstall(e) {
		const cache = await caches.open(cacheName);
		await cache.addAll(["manifest.json", "sw.js",]);
	}

	/**
	 * @param {ExtendableEvent} e 
	 */
	async function handleActivate(e) {
		await self.clients.claim();
		for (const k of await caches.keys()) {
			if (k != cacheName)
				await caches.delete(k);
		}
	}

	self.addEventListener("fetch", (e) => e.respondWith(handleFetch(e)), { passive: true });
	self.addEventListener("message", (e) => e.waitUntil(handleMessage(e)), { passive: true });
	self.addEventListener("install", (e) => e.waitUntil(handleInstall(e)), { passive: true });
	self.addEventListener("activate", (e) => e.waitUntil(handleActivate(e)), { passive: true });
})(self);