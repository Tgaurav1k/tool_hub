CREATE TABLE "user_tool_allowances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tool_allowances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_tool_allowances_userId_toolId_key" ON "user_tool_allowances"("userId", "toolId");

ALTER TABLE "user_tool_allowances" ADD CONSTRAINT "user_tool_allowances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_tool_allowances" ADD CONSTRAINT "user_tool_allowances_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_tool_allowances" ADD CONSTRAINT "user_tool_allowances_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
