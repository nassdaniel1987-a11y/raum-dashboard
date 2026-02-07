/**
 * Parst einen Zeitstring (HH:MM oder HH:MM:SS) in Minuten seit Mitternacht.
 * Gibt null zurück bei ungültigem Input.
 */
export function parseTime(timeString: string | null | undefined): number | null {
	if (!timeString) return null;
	const [hours, minutes] = timeString.split(':').map(Number);
	if (isNaN(hours) || isNaN(minutes)) return null;
	return hours * 60 + minutes;
}
