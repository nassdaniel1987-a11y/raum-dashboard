const LEGACY_PROXY_URL = 'https://dash-board09.netlify.app/api/blitz-data';

function response(statusCode, body) {
	return {
		statusCode,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		},
		body: JSON.stringify(body)
	};
}

async function fetchLegacyProxy(datum) {
	const fallbackUrl = new URL(LEGACY_PROXY_URL);
	if (datum) fallbackUrl.searchParams.set('datum', datum);

	const fallbackResponse = await fetch(fallbackUrl);
	const text = await fallbackResponse.text();

	return {
		statusCode: fallbackResponse.status,
		headers: {
			'content-type': fallbackResponse.headers.get('content-type') ?? 'application/json; charset=utf-8',
			'cache-control': 'no-store'
		},
		body: text
	};
}

export const handler = async (event) => {
	const apiUrl = process.env.BLITZ_PROTOKOLL_API_URL;
	const apiKey = process.env.BLITZ_PROTOKOLL_API_KEY;
	const datum = event.queryStringParameters?.datum;

	if (!apiUrl || !apiKey) {
		return fetchLegacyProxy(datum);
	}

	try {
		const normalizedApiUrl = /^https?:\/\//i.test(apiUrl) ? apiUrl : `https://${apiUrl}`;
		const fetchUrl = new URL(normalizedApiUrl);
		if (datum) fetchUrl.searchParams.set('datum', datum);

		const blitzResponse = await fetch(fetchUrl, {
			headers: {
				authorization: `Bearer ${apiKey}`,
				accept: 'application/json'
			}
		});

		if (!blitzResponse.ok) {
			return fetchLegacyProxy(datum);
		}

		return {
			statusCode: 200,
			headers: {
				'content-type': blitzResponse.headers.get('content-type') ?? 'application/json; charset=utf-8',
				'cache-control': 'no-store'
			},
			body: await blitzResponse.text()
		};
	} catch (error) {
		console.error('[Display Blitz] Direkter Fetch fehlgeschlagen, nutze Fallback:', error);
		try {
			return fetchLegacyProxy(datum);
		} catch (fallbackError) {
			console.error('[Display Blitz] Fallback fehlgeschlagen:', fallbackError);
			return response(502, { error: 'Blitz-Verbindung fehlgeschlagen.' });
		}
	}
};
