/**
 * Next.js instrumentation hook — runs once when the server runtime starts
 * (including static-generation workers during `next build`).
 *
 * Polyfills `location` on the server so third-party libraries that reference it
 * directly (e.g. Supabase Realtime's `location.protocol`) don't throw
 * `ReferenceError: location is not defined` during SSR / prerender.
 */
export async function register() {
  if (typeof (globalThis as { location?: unknown }).location !== 'undefined') return

  const fallback = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const empty = {
    href: fallback,
    origin: fallback,
    protocol: 'http:',
    host: 'localhost',
    hostname: 'localhost',
    port: '',
    pathname: '/',
    search: '',
    hash: '',
  }

  try {
    const u = new URL(fallback)
    ;(globalThis as Record<string, unknown>).location = {
      href: u.href,
      origin: u.origin,
      protocol: u.protocol,
      host: u.host,
      hostname: u.hostname,
      port: u.port,
      pathname: u.pathname,
      search: u.search,
      hash: u.hash,
    }
  } catch {
    ;(globalThis as Record<string, unknown>).location = empty
  }
}
