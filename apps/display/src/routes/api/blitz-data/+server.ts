import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const apiUrl = env.BLITZ_PROTOKOLL_API_URL;
	const apiKey = env.BLITZ_PROTOKOLL_API_KEY;
	const datum = url.searchParams.get('datum');

	async function fetchLegacyProxy() {
		const fallbackUrl = new URL('https://dash-board09.netlify.app/api/blitz-data');
		if (datum) fallbackUrl.searchParams.set('datum', datum);
		const response = await fetch(fallbackUrl);
		if (!response.ok) {
			return json({ error: `Blitz-Fallback Fehler: ${response.status}` }, { status: response.status });
		}
		return json(await response.json());
	}

	if (!apiUrl || !apiKey) {
		return fetchLegacyProxy();
	}

	const normalizedApiUrl = /^https?:\/\//i.test(apiUrl) ? apiUrl : `https://${apiUrl}`;
	const fetchUrl = new URL(normalizedApiUrl);
	if (datum) {
		fetchUrl.searchParams.set('datum', datum);
	}

	try {
		const response = await fetch(fetchUrl, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			return fetchLegacyProxy();
		}

		return json(await response.json());
	} catch (error) {
		console.error('[Display Blitz] Direkter Fetch fehlgeschlagen, nutze Fallback:', error);
		return fetchLegacyProxy();
	}
};
