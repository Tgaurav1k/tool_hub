export const APP_NAME = 'Tool HUB'

/** Filename under `frontend/public/logo/` (mirrored in `frontend/src/logo/` for `@logo/...` imports). */
export const BRAND_LOGO_FILE = 'WhatsApp Image 2026-04-16 at 16.36.14.jpeg'

/** Sidebar brand image URL (Vite serves `public/logo/` at site root). */
export const BRAND_LOGO_URL = `/logo/${encodeURIComponent(BRAND_LOGO_FILE)}`

// @ts-ignore — import.meta.env is injected by Vite at bundle time; safe to ignore for tsc
export const API_URL = (import.meta as any)?.env?.VITE_API_URL || '/api'

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const

export const SIDEBAR = {
  expanded: 248,
  collapsed: 72,
} as const

export const ANIMATION = {
  staggerDelay: 0.05,
  cardDuration: 0.3,
  pageDuration: 0.4,
} as const
