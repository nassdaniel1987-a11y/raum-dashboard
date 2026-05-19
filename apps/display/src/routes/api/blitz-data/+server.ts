import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url }) => {
	const apiUrl = env.BLITZ_PROTOKOLL_API_URL;
	const apiKey = env.BLITZ_PROTOKOLL_API_KEY;

	if (!apiUrl || !apiKey) {
		return json({ error: 'Blitz-Protokoll nicht konfiguriert.' }, { status: 503 });
	}

	const datum = url.searchParams.get('datum');
	let fetchUrl = apiUrl;
	if (datum) {
		fetchUrl += `?datum=${encodeURIComponent(datum)}`;
	}

	try {
		const response = await fetch(fetchUrl, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				Accept: 'application/json'
			}
		});

		if (!response.ok) {
			return json({ error: `Blitz-API Fehler: ${response.status}` }, { status: response.status });
		}

		return json(await response.json());
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
		return json({ error: `Verbindung fehlgeschlagen: ${message}` }, { status: 502 });
	}
};
