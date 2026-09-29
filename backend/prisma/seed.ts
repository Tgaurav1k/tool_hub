import { PrismaClient } from '../src/generated/prisma'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// Host serving the seeded tools. Set DEPLOY_HOST in backend/.env.
const SERVER_HOST = process.env.DEPLOY_HOST || 'localhost'

const categories = [
  { name: 'Finance',    icon: 'DollarSign',  colorToken: '#B08D62', sortOrder: 1 },
  { name: 'Marketing',  icon: 'Megaphone',   colorToken: '#4A7AB5', sortOrder: 2 },
  { name: 'Content',    icon: 'FileText',    colorToken: '#6B5438', sortOrder: 3 },
  { name: 'Operations', icon: 'Settings',    colorToken: '#D4932A', sortOrder: 4 },
  { name: 'HR',         icon: 'Users',       colorToken: '#5B8A55', sortOrder: 5 },
  { name: 'Sales',      icon: 'TrendingUp',  colorToken: '#9A7D5B', sortOrder: 6 },
  { name: 'General',    icon: 'LayoutGrid',  colorToken: '#C4A87A', sortOrder: 7 },
  { name: 'Favorites',  icon: 'Star',        colorToken: '#B08D62', sortOrder: 8 },
]

// Role definitions live in the `roles` table (see migration). SuperAdmin user references roles.slug via users.role.

const tools = [
  {
    name: 'Amazon Engine',
    description: 'Amazon Keyword Engine — analytics and insights for Amazon campaigns',
    url: `https://amazon-engine.${SERVER_HOST}.nip.io/?start=2026-04-01&end=2026-04-07`,
    icon: 'ShoppingCart',
    category: 'Finance',
    status: 'active',
    slug: 'amazon-engine',
    // Access granted via per-user tool assignment. No sync API yet.
    requiresToolAssignment: true,
  },
  {
    name: 'Keyword Trend Engine',
    description: 'Track keyword demand, seasonality, and search trends in real time',
    url: `http://${SERVER_HOST}:3100/keywordengine/query/sheet`,
    icon: 'TrendingUp',
    category: 'Marketing',
    status: 'active',
    slug: 'keyword-trend-engine',
    requiresToolAssignment: true,
  },
  {
    name: 'Image Generation',
    description: 'AI-powered image generation and editing',
    url: process.env.IMAGE_GENERATION_TOOL_URL || `http://${SERVER_HOST}:1001`,
    icon: 'Image',
    category: 'Content',
    status: 'active',
    slug: 'image-generation',
    // Only tool with a working /api/admin/sync-user endpoint.
    requiresToolAssignment: true,
  },
  {
    name: 'Docket Tool',
    description: 'Docket engine for managing and tracking operational dockets',
    url: `http://${SERVER_HOST}:3100/docketengine/`,
    icon: 'ClipboardList',
    category: 'Operations',
    status: 'active',
    slug: 'docket-tool',
    requiresToolAssignment: true,
  },
  {
    name: 'BigData DB Editor',
    description: 'Browse, query, and edit BigData datasets in a lightweight web editor',
    url: `http://${SERVER_HOST}:6002/`,
    icon: 'Database',
    category: 'Marketing',
    status: 'active',
    slug: 'bigdata-db-editor',
    requiresToolAssignment: true,
  },
  {
    name: 'Bulk AI Processor',
    description: 'Batch AI processing — run large-scale AI jobs across content, data, and marketing workflows',
    url: `http://${SERVER_HOST}:8080/`,
    icon: 'Bot',
    category: 'Marketing',
    status: 'active',
    slug: 'bulk-ai-processor',
    requiresToolAssignment: true,
  },
  {
    name: 'Xpensebuddy',
    description: 'Track, submit, and review expense claims for your team',
    url: `http://${SERVER_HOST}:6003/`,
    icon: 'Receipt',
    category: 'Finance',
    status: 'active',
    slug: 'xpensebuddy',
    requiresToolAssignment: true,
  },
  {
    name: 'XB',
    description: 'Extract Invoice',
    url: `http://${SERVER_HOST}:8010/`,
    icon: 'FileText',
    category: 'Finance',
    status: 'active',
    slug: 'xb',
    requiresToolAssignment: true,
  },
  {
    name: 'Blog Writer',
    description: 'Create blogs from here',
    url: 'http://stwriter.zerodragautomation.com/',
    icon: 'FileSignature',
    category: 'Marketing',
    status: 'active',
    slug: 'blog-writer',
    requiresToolAssignment: true,
  },
  {
    name: 'Live DB Backup',
    description: 'Check latest DB backups',
    url: `http://${SERVER_HOST}:8070/`,
    icon: 'HardDrive',
    category: 'Operations',
    status: 'active',
    slug: 'live-db-backup',
    requiresToolAssignment: true,
  },
]

async function main() {
  console.log('Seeding categories...')
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  // NOTE: The seed is intentionally NON-DESTRUCTIVE and ADD-ONLY. It only creates the
  // tools defined above when they are missing, and must never overwrite or delete rows —
  // the Docker CMD runs this seed on every container start, so any tool an admin created
  // through the UI (or any edit they made) would otherwise be wiped/reset on each redeploy.
  //
  // ADD-ONLY: for each tool below, create it ONLY if it does not already exist.
  // Existing tools are left completely untouched — no overwrite ("force"), no delete.
  // This means: tools added via the UI button always survive, and any admin edits to
  // these seed tools are never reset. The seed only restores a tool if it is missing
  // (e.g. it was deleted, or the database was recreated).
  console.log('Seeding tools (add-only, never overwrite or delete)...')
  let createdCount = 0
  for (const tool of tools as {
    name: string
    description: string
    url: string
    icon: string
    category: string
    status: string
    slug?: string
    requiresToolAssignment?: boolean
  }[]) {
    const category = await prisma.category.findUnique({ where: { name: tool.category } })
    if (!category) continue

    // Treat a tool as already present if its slug matches, or (when no slug) its
    // name within the same category matches.
    const existing = tool.slug
      ? await prisma.tool.findUnique({ where: { slug: tool.slug } })
      : await prisma.tool.findFirst({ where: { name: tool.name, categoryId: category.id } })

    if (existing) continue // already there — leave it and any admin edits untouched

    await prisma.tool.create({
      data: {
        name: tool.name,
        description: tool.description,
        url: tool.url,
        icon: tool.icon,
        status: tool.status,
        categoryId: category.id,
        slug: tool.slug ?? null,
        requiresToolAssignment: tool.requiresToolAssignment ?? false,
      },
    })
    createdCount++
  }
  console.log(`Tools: created ${createdCount} missing tool(s); existing tools left untouched.`)

  console.log('Seeding SuperAdmins...')
  let role = (process.env.SUPERADMIN_ROLE || 'superadmin').trim().toLowerCase()
  if (role !== 'superadmin') {
    console.warn(
      `SUPERADMIN_ROLE must be "superadmin" (got "${process.env.SUPERADMIN_ROLE}"); using superadmin in DB.`,
    )
    role = 'superadmin'
  }

  // Two superadmins: #1 is the primary account, #2 is intentionally hidden from the
  // activity log (see logActivity — it never writes rows for SUPERADMIN_EMAIL2).
  const superadmins = [
    { email: process.env.SUPERADMIN_EMAIL1, password: process.env.SUPERADMIN_PASSWORD1 },
    { email: process.env.SUPERADMIN_EMAIL2, password: process.env.SUPERADMIN_PASSWORD2 },
  ].filter((s): s is { email: string; password: string } => Boolean(s.email && s.password))

  if (superadmins.length === 0) {
    console.warn('No SUPERADMIN_EMAIL1/2 + SUPERADMIN_PASSWORD1/2 set; skipping superadmin seed.')
  }

  for (const { email, password } of superadmins) {
    const existing = await prisma.user.findUnique({ where: { email } })

    if (!existing) {
      const hash = await bcrypt.hash(password, 12)
      const superadmin = await prisma.user.create({
        data: {
          name: 'Super Admin',
          email,
          passwordHash: hash,
          role,
          status: 'active',
        },
      })

      const allCategories = await prisma.category.findMany()
      for (const cat of allCategories) {
        await prisma.categoryAssignment.create({
          data: {
            userId: superadmin.id,
            categoryId: cat.id,
            assignedById: superadmin.id,
          },
        })
      }

      console.log(`SuperAdmin ${email} seeded with all categories.`)
    } else {
      const hash = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { email },
        data: { role, status: 'active', passwordHash: hash },
      })
      console.log(`SuperAdmin ${email} already exists; role, status, and password updated from env.`)
    }
  }

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
