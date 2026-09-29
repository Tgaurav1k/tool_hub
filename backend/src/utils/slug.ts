import type { PrismaClient } from '../generated/prisma'

// Combining diacritical marks range (U+0300–U+036F), used to strip accents after NFKD normalization.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g')

/** Convert arbitrary text into a URL-safe slug: lowercase, alphanumerics joined by single hyphens. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '') // strip accents (é -> e)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumerics -> single hyphen
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
}

/**
 * Build a slug from `source` and guarantee it is unique in the `tools` table.
 * Appends `-2`, `-3`, … on collision. `excludeId` lets a tool keep its own slug on update.
 */
export async function generateUniqueToolSlug(
  prisma: PrismaClient,
  source: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(source) || 'tool'
  let candidate = base
  let suffix = 2
  while (true) {
    const existing = await prisma.tool.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${base}-${suffix++}`
  }
}
