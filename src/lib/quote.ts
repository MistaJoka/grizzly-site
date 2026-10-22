// Groundwork public request-a-quote integration (read from /home/sleepi/Work/groundwork, not modified).
//
// Groundwork exposes NO JSON API for this. It has a plain multipart route handler:
//   POST {GROUNDWORK_QUOTE_URL}/send   (i.e. /r/<slug>/send)
// which answers with a 303 redirect back to the hosted page (?m=sent on success, ?e=<code> on error).
// So the site's form is a plain HTML <form method="post" enctype="multipart/form-data"> whose action
// points at that route. No JavaScript, no CORS: the browser does a normal navigation to the hosted page.

/** Field names Groundwork's parseRequestForm() reads. */
export const GROUNDWORK_FIELDS = {
  name: 'name', // required, max 120
  phone: 'phone', // phone OR email required; phone needs 7+ digits
  email: 'email',
  address: 'address', // max 300
  service: 'service', // max 100
  message: 'message', // max 2000
  preferredDates: 'preferred_dates', // max 200
  photos: 'photos', // up to 3 files, JPEG/PNG/WebP, 5 MB each
  honeypot: 'website', // must stay empty; a filled value is silently dropped
} as const;

export const GROUNDWORK_LIMITS = { maxPhotos: 3, maxPhotoMb: 5, ratePerHour: 5 } as const;

/** Normalise the configured hosted-page URL; '' when unset or not http(s). */
export function quotePageUrl(raw: string): string {
  const value = raw.trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s]+$/i.test(value) ? value : '';
}

/** The route the form posts to, or '' when the quote URL is not configured. */
export function quoteActionUrl(raw: string): string {
  const base = quotePageUrl(raw);
  return base ? `${base}/send` : '';
}
