/**
 * Publishable key is set at build time (see vite.config.js define + loadEnv + process.env).
 * Configure VITE_CLERK_PUBLISHABLE_KEY or NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY on the host.
 * Never put CLERK_SECRET_KEY in the client.
 */
/* global __VELARO_CLERK_PUBLISHABLE_KEY__ */
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

const fromDefine = normalizePublishableKey(__VELARO_CLERK_PUBLISHABLE_KEY__);

const fromImportMeta = normalizePublishableKey(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

export const CLERK_PUBLISHABLE_KEY = fromDefine || fromImportMeta;

export const hasClerkPublishableKey = Boolean(CLERK_PUBLISHABLE_KEY);
