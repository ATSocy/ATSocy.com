/**
 * Pure helpers for the post-composer forms. Kept here (not in the components)
 * so they're easy to test and so the form components stay declarative.
 */

/** Compose a kind-1 content body from title + body — title only when no body. */
export function eventContent(title: string, body: string): string {
  const t = title.trim();
  const b = body.trim();
  return b ? `${t}\n\n${b}` : t;
}

/**
 * Normalize user-entered external URLs for link posts. Bare domains like
 * `example.com` are treated as web URLs and upgraded to `https://...` so the
 * rest of the Pulse rendering pipeline can recognize them as links.
 */
export function normalizeExternalUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Short random id for poll options. */
function optionId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export interface PollOption {
  id: string;
  text: string;
}

export function makeOption(text = ''): PollOption {
  return { id: optionId(), text };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local datetime string for `<input type="datetime-local">` and the date picker. */
export function toDateTimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function parseDateTimeLocal(value: string): Date | null {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function setDatePart(value: string, date: Date): string {
  const d = parseDateTimeLocal(value) ?? new Date();
  d.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return toDateTimeLocal(d);
}

export function setTimePart(value: string, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const d = parseDateTimeLocal(value) ?? new Date();
  d.setHours(hours, minutes, 0, 0);
  return toDateTimeLocal(d);
}

/** Default poll end time = 24h from now, on a minute boundary. */
export function defaultEndsAt(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return toDateTimeLocal(d);
}
