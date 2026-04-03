/**
 * Publishable key is inlined at build time from VITE_CLERK_PUBLISHABLE_KEY.
 * Trimmed; optional wrapping quotes removed (common copy/paste mistakes).
 */
function normalizePublishableKey(raw) {
  let s = String(raw ?? "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export const CLERK_PUBLISHABLE_KEY = normalizePublishableKey(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
);

export const hasClerkPublishableKey = Boolean(CLERK_PUBLISHABLE_KEY);
