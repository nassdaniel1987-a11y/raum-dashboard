import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import type { BlitzApiResponse, BlitzApiRaeume, BlitzApiPersonen } from '$lib/types';

/**
 * GET /api/blitz-data
 * Proxy-Route: Holt Daten von der Blitz-Protokoll API (Server-seitig, API-Key bleibt geschützt).
 *
 * Query-Parameter:
 *   ?type=planung     — Tagesplanung mit zuweisungen_gesamt (default)
 *   ?type=raeume      — Nur Räume-Stammliste
 *   ?type=personen    — Nur Personen-Stammliste
 *   ?datum=2026-03-17 — Optional: Bestimmtes Datum (nur für type=planung)
 */
export const GET: RequestHandler = async ({ url }) => {
	const apiUrl = env.BLITZ_PROTOKOLL_API_URL;
	const apiKey = env.BLITZ_PROTOKOLL_API_KEY;

	if (!apiUrl || !apiKey) {
		return json(
			{ error: 'Blitz-Protokoll nicht konfiguriert. Bitte BLITZ_PROTOKOLL_API_URL und BLITZ_PROTOKOLL_API_KEY setzen.' },
			{ status: 503 }
		);
	}

	const type = url.searchParams.get('type') || 'planung';
	const datum = url.searchParams.get('datum');

	let fetchUrl: string;
	switch (type) {
		case 'raeume':
			fetchUrl = `${apiUrl}/raeume`;
			break;
		case 'personen':
			fetchUrl = `${apiUrl}/personen`;
			break;
		default:
			fetchUrl = apiUrl;
			if (datum) {
				fetchUrl += `?datum=${encodeURIComponent(datum)}`;
			}
	}

	try {
		const response = await fetch(fetchUrl, {
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unbekannter Fehler');
			console.error(`[Blitz-Data] API-Fehler ${response.status}:`, errorText);
			return json(
				{ error: `Blitz-API Fehler: ${response.status}` },
				{ status: response.status }
			);
		}

		const data: BlitzApiResponse | BlitzApiRaeume | BlitzApiPersonen = await response.json();
		return json(data);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
		console.error('[Blitz-Data] Fetch fehlgeschlagen:', message);
		return json({ error: `Verbindung fehlgeschlagen: ${message}` }, { status: 502 });
	}
};
