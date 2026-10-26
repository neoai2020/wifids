const LIVE_SITE_URL = "https://www.getwifigiditalsystem.com"

export const APP_ORIGINS = [LIVE_SITE_URL] as const

const DEFAULT_SITE_URL = LIVE_SITE_URL

function normalizeOrigin(url: string): string {
  const origin = url.replace(/\/$/, "")
  // Apex has no DNS record; www is the host that resolves to the app.
  if (origin === "https://getwifigiditalsystem.com") return LIVE_SITE_URL
  return origin
}

function isAllowedOrigin(origin: string): boolean {
  return APP_ORIGINS.includes(normalizeOrigin(origin) as (typeof APP_ORIGINS)[number])
}

/** Canonical app URL for auth redirects (password reset, email links). */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin
    if (isAllowedOrigin(origin)) {
      return normalizeOrigin(origin)
    }
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const configured = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL)
    if (isAllowedOrigin(configured)) {
      return configured
    }
  }

  return DEFAULT_SITE_URL
}

export function getAuthCallbackUrl(nextPath: string): string {
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`
  return `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`
}
