import { PrismaClient } from './src/generated/prisma/index.js';
import 'dotenv/config';

const prisma = new PrismaClient();

const tools = await prisma.tool.findMany({
  include: { category: { select: { name: true } } },
  orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
});

console.log(`TOTAL TOOLS: ${tools.length}\n`);
console.log(JSON.stringify(
  tools.map((t) => ({
    name: t.name,
    category: t.category?.name ?? null,
    status: t.status,
    slug: t.slug,
    url: t.url,
    requiresToolAssignment: t.requiresToolAssignment,
  })),
  null,
  2,
));

await prisma.$disconnect();
