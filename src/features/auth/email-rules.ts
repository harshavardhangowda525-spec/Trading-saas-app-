/**
 * Small blocklist of common throwaway-email domains to limit free-credit farming.
 * Not exhaustive by design; rate limits (M3) are the second line of defence.
 */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmail.dev",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "throwawaymail.com",
  "fakeinbox.com",
  "mintemail.com",
  "emailondeck.com",
  "mohmal.com",
  "tempail.com",
  "moakt.com",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const domain = normalizeEmail(email).split("@")[1];
  return domain !== undefined && DISPOSABLE_DOMAINS.has(domain);
}

export function isAdminEmail(email: string, adminEmails: readonly string[]): boolean {
  return adminEmails.includes(normalizeEmail(email));
}
