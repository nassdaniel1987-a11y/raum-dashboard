import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

/**
 * POST /api/blitz-webhook
 * Empfängt Webhook-Notifications vom Blitz-Protokoll wenn sich die Planung ändert.
 * Das Dashboard holt sich dann selbst die aktuellen Daten.
 */
export const POST: RequestHandler = async ({ request }) => {
	// API-Key prüfen
	const authHeader = request.headers.get('authorization');
	const expectedToken = env.BLITZ_PROTOKOLL_API_KEY;

	if (!expectedToken) {
		return json({ error: 'Blitz-Integration nicht konfiguriert' }, { status: 503 });
	}

	if (authHeader !== `Bearer ${expectedToken}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Webhook-Body lesen (optional, für Logging)
	try {
		const body = await request.json();
		console.log('[Blitz-Webhook] Event empfangen:', body.event, 'Datum:', body.datum);
	} catch {
		// Body ist optional
	}

	// Wir geben einfach OK zurück — das eigentliche Daten-Holen passiert
	// über den Polling-Service im Client, der durch den Webhook getriggert wird.
	// In Zukunft könnte hier ein Server-Sent-Event oder ähnliches ausgelöst werden.
	return json({ ok: true, message: 'Webhook empfangen' });
};
