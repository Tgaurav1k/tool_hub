-- Per-category flag: standard tools are either all visible (false) or allowlist-only (true).
ALTER TABLE "category_assignments" ADD COLUMN "restrictStandardTools" BOOLEAN NOT NULL DEFAULT false;

-- Existing per-tool rows imply allowlist mode for that assignment.
UPDATE "category_assignments" AS ca
SET "restrictStandardTools" = true
FROM "user_tool_allowances" AS uta
JOIN "tools" AS t ON t.id = uta."toolId"
WHERE uta."userId" = ca."userId" AND t."categoryId" = ca."categoryId";
