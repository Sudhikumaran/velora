/**
 * Publishable key is inlined at build time. Vite: VITE_CLERK_PUBLISHABLE_KEY (preferred),
 * or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY if you copied Clerk’s Next.js env names.
 * Never put CLERK_SECRET_KEY in the client; it belongs only on the server.
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

const rawPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const CLERK_PUBLISHABLE_KEY = normalizePublishableKey(rawPublishableKey);

export const hasClerkPublishableKey = Boolean(CLERK_PUBLISHABLE_KEY);
