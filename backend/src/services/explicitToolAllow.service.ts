import prisma from '../db/prisma'

/**
 * Freezes a user's access in a category to every standard tool that exists
 * at this moment. Later-added tools will stay hidden from the user until
 * an admin explicitly grants them.
 */
export async function freezeCategoryToCurrentTools(
  userId: string,
  categoryId: string,
  grantedById: string,
) {
  const toolsInCat = await prisma.tool.findMany({
    where: { categoryId, requiresToolAssignment: false },
    select: { id: true },
  })
  if (toolsInCat.length === 0) {
    await prisma.categoryAssignment.update({
      where: { userId_categoryId: { userId, categoryId } },
      data: { restrictStandardTools: false },
    })
    return
  }

  await prisma.categoryAssignment.update({
    where: { userId_categoryId: { userId, categoryId } },
    data: { restrictStandardTools: true },
  })
  await prisma.userToolAllow.deleteMany({
    where: { userId, tool: { categoryId } },
  })
  await prisma.userToolAllow.createMany({
    data: toolsInCat.map((t) => ({ userId, toolId: t.id, grantedById })),
  })
}

export async function pruneUserToolAllowsOutsideCategories(userId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) {
    await prisma.userToolAllow.deleteMany({ where: { userId } })
    return
  }
  await prisma.userToolAllow.deleteMany({
    where: {
      userId,
      tool: { categoryId: { notIn: categoryIds } },
    },
  })
}

/**
 * For each assigned category, persist an explicit per-tool allowlist. Tools added
 * to a category after this runs stay hidden from the user until an admin explicitly
 * grants them (no "unrestricted" shortcut for non-empty categories).
 */
export async function syncStandardToolAccessForUser(
  userId: string,
  categoryIds: string[],
  explicitToolIds: string[],
  grantedById: string,
) {
  const categorySet = new Set(categoryIds)

  const uniqueExplicit = [...new Set(explicitToolIds)]

  const toolsMentioned = await prisma.tool.findMany({
    where: { id: { in: uniqueExplicit } },
    select: { id: true, categoryId: true, requiresToolAssignment: true },
  })
  const foundIds = new Set(toolsMentioned.map((t) => t.id))
  for (const toolId of uniqueExplicit) {
    if (!foundIds.has(toolId)) {
      throw new Error(`Unknown or invalid tool id: ${toolId}`)
    }
  }

  for (const t of toolsMentioned) {
    if (t.requiresToolAssignment) {
      throw new Error(`Tool "${t.id}" uses linked access only; manage it under Linked tool access.`)
    }
    if (!categorySet.has(t.categoryId)) {
      throw new Error('Each allowed tool must belong to an assigned category.')
    }
  }

  for (const categoryId of categoryIds) {
    const toolsInCat = await prisma.tool.findMany({
      where: { categoryId, requiresToolAssignment: false },
      select: { id: true },
    })
    const nonGatedIds = toolsInCat.map((x) => x.id)
    const nonGatedSet = new Set(nonGatedIds)
    const selectedInCat = uniqueExplicit.filter((id) => nonGatedSet.has(id))
    const selectedSet = new Set(selectedInCat)

    // Only treat a category as "unrestricted" when there is genuinely nothing to
    // restrict. Any non-empty category always gets an explicit allowlist so future
    // tools don't silently become visible to users who were granted access earlier.
    const noToolsToRestrict = nonGatedIds.length === 0

    await prisma.categoryAssignment.update({
      where: { userId_categoryId: { userId, categoryId } },
      data: { restrictStandardTools: !noToolsToRestrict },
    })

    await prisma.userToolAllow.deleteMany({
      where: { userId, tool: { categoryId } },
    })

    if (!noToolsToRestrict && selectedInCat.length > 0) {
      await prisma.userToolAllow.createMany({
        data: [...selectedSet].map((toolId) => ({
          userId,
          toolId,
          grantedById,
        })),
      })
    }
  }
}
