import prisma from '../db/prisma'

export async function syncCategoryAssignments(
  userId: string,
  categoryIds: string[],
  assignedById: string,
) {
  const current = await prisma.categoryAssignment.findMany({
    where: { userId },
    select: { categoryId: true },
  })

  const currentIds = new Set(current.map((a) => a.categoryId))
  const desiredIds = new Set(categoryIds)

  const toAdd = categoryIds.filter((id) => !currentIds.has(id))
  const toRemove = current.filter((a) => !desiredIds.has(a.categoryId)).map((a) => a.categoryId)

  if (toRemove.length > 0) {
    await prisma.categoryAssignment.deleteMany({
      where: { userId, categoryId: { in: toRemove } },
    })
  }

  if (toAdd.length > 0) {
    await prisma.categoryAssignment.createMany({
      data: toAdd.map((categoryId) => ({
        userId,
        categoryId,
        assignedById,
      })),
    })
  }

  return prisma.categoryAssignment.findMany({
    where: { userId },
    include: { category: true },
  })
}
