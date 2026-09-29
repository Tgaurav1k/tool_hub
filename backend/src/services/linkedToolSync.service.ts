/**
 * Syncs a Toolhub user account to a linked external tool using the same flow as
 * `tools/API to Link Tool Interface with Ima.txt` (superadmin cookie + POST /api/admin/sync-user).
 */

function linkedToolBaseUrl(): string | undefined {
  const raw = process.env.LINKED_TOOL_API_BASE_URL?.trim()
  return raw || undefined
}

function superadminCreds(): { username: string; password: string } | undefined {
  const username = process.env.LINKED_TOOL_SUPERADMIN_USERNAME?.trim()
  const password = process.env.LINKED_TOOL_SUPERADMIN_PASSWORD?.trim()
  if (!username || !password) return undefined
  return { username, password }
}

/**
 * The username we send to the linked tool's `/api/admin/sync-user`.
 * ImageGen accepts any string up to 100 chars with no format validation,
 * so we pass the email through unchanged (only whitespace trimmed) — this way
 * the username on the linked tool matches the email the admin typed in ToolHub,
 * including capitalization.
 */
export function emailToLinkedToolUsername(email: string): string {
  return email.trim()
}

function parseTokenCookie(setCookieHeader: string | null): string | undefined {
  if (!setCookieHeader) return undefined
  const first = setCookieHeader.split('\n')[0]?.trim() ?? setCookieHeader
  const tokenMatch = first.match(/token=([^;]+)/)
  return tokenMatch ? `token=${tokenMatch[1]}` : undefined
}

function parseTokenFromLoginResponse(res: Response): string | undefined {
  const withGetSetCookie = res.headers as unknown as { getSetCookie?: () => string[] }
  if (typeof withGetSetCookie.getSetCookie === 'function') {
    for (const c of withGetSetCookie.getSetCookie()) {
      const m = c.match(/^token=([^;]+)/)
      if (m) return `token=${m[1]}`
    }
  }
  return parseTokenCookie(res.headers.get('set-cookie'))
}

export type LinkedToolSyncResult = { ok: true } | { ok: false; message: string }

export async function syncUserToLinkedTool(
  plainPassword: string,
  email: string,
  toolRole: 'user' | 'admin',
): Promise<LinkedToolSyncResult> {
  const base = linkedToolBaseUrl()
  const creds = superadminCreds()
  if (!base || !creds) {
    return {
      ok: false,
      message:
        'Linked tool sync is not configured (set LINKED_TOOL_API_BASE_URL, LINKED_TOOL_SUPERADMIN_USERNAME, LINKED_TOOL_SUPERADMIN_PASSWORD).',
    }
  }

  const baseNorm = base.replace(/\/$/, '')
  const loginRes = await fetch(`${baseNorm}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: creds.username, password: creds.password }),
  })

  if (!loginRes.ok) {
    const text = await loginRes.text().catch(() => '')
    return { ok: false, message: `Linked tool superadmin login failed (${loginRes.status}): ${text}` }
  }

  const cookie = parseTokenFromLoginResponse(loginRes)
  if (!cookie) {
    return { ok: false, message: 'Linked tool login did not return a token cookie.' }
  }

  const username = emailToLinkedToolUsername(email)
  const syncRes = await fetch(`${baseNorm}/api/admin/sync-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookie,
    },
    body: JSON.stringify({
      username,
      password: plainPassword,
      role: toolRole,
    }),
  })

  if (!syncRes.ok) {
    const text = await syncRes.text().catch(() => '')
    return { ok: false, message: `Linked tool sync-user failed (${syncRes.status}): ${text}` }
  }

  return { ok: true }
}
