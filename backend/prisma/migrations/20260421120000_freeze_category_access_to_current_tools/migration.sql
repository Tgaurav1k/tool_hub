-- Freeze every existing category assignment with restrictStandardTools=false to its
-- current standard-tool set. Previously a user with "unrestricted" category access
-- automatically saw any tool added later; now they only see the tools that existed
-- at the moment their access was granted (or at the moment this migration runs, for
-- pre-existing rows). An admin can still extend access via the user detail page.

-- 1) Insert a UserToolAllow row for every non-gated tool in every currently-unrestricted
--    assignment, skipping rows that already exist.
INSERT INTO "user_tool_allowances" ("id", "userId", "toolId", "grantedById", "grantedAt")
SELECT
  gen_random_uuid()::text,
  ca."userId",
  t."id",
  ca."assignedById",
  CURRENT_TIMESTAMP
FROM "category_assignments" ca
JOIN "tools" t
  ON t."categoryId" = ca."categoryId"
 AND t."requiresToolAssignment" = false
WHERE ca."restrictStandardTools" = false
  AND NOT EXISTS (
    SELECT 1 FROM "user_tool_allowances" uta
    WHERE uta."userId" = ca."userId" AND uta."toolId" = t."id"
  );

-- 2) Flip those assignments to restricted so the per-tool allowlist is now authoritative.
UPDATE "category_assignments"
SET "restrictStandardTools" = true
WHERE "restrictStandardTools" = false
  AND EXISTS (
    SELECT 1 FROM "tools" t
    WHERE t."categoryId" = "category_assignments"."categoryId"
      AND t."requiresToolAssignment" = false
  );
