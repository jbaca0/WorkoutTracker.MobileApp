/**
 * Date helpers for the YYYY-MM-DD strings the API exchanges.
 *
 * These deliberately use local calendar fields rather than toISOString(), which
 * converts to UTC first. For a user west of UTC, `new Date().toISOString()` late
 * in the day already reads as tomorrow, which would shift a picked date by one.
 */

/** Formats a Date as YYYY-MM-DD using its local calendar fields. */
export function toDateInputString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/** Parses a YYYY-MM-DD string as local midnight. Returns null if unparseable. */
export function parseDateInputString(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    // Reject values like 2026-02-31 that JS would silently roll over.
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
    }
    return date;
}

/** Renders a YYYY-MM-DD string for display, e.g. "Aug 24, 2026". */
export function formatDisplayDate(value: string): string {
    const date = parseDateInputString(value);
    if (!date) return value;
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** Renders a Date for display, e.g. "Aug 24, 2026". */
export function formatDisplayDateFromDate(date: Date): string {
    return formatDisplayDate(toDateInputString(date));
}
