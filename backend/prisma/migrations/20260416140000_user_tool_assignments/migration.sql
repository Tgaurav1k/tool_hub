-- AlterTable
ALTER TABLE "tools" ADD COLUMN "slug" TEXT;
ALTER TABLE "tools" ADD COLUMN "requiresToolAssignment" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "tools_slug_key" ON "tools"("slug");

-- CreateTable
CREATE TABLE "user_tool_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "toolRole" TEXT NOT NULL DEFAULT 'user',
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tool_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_tool_assignments_userId_toolId_key" ON "user_tool_assignments"("userId", "toolId");

-- AddForeignKey
ALTER TABLE "user_tool_assignments" ADD CONSTRAINT "user_tool_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tool_assignments" ADD CONSTRAINT "user_tool_assignments_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tool_assignments" ADD CONSTRAINT "user_tool_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
