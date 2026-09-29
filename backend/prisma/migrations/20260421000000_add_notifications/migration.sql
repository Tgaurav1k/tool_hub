-- Persistent in-app notifications (access updates, status changes, etc.) so users
-- who are offline when an event fires still see it in their bell panel on next login.
CREATE TABLE "notifications" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "type"      TEXT         NOT NULL DEFAULT 'access_update',
  "scope"     TEXT,
  "title"     TEXT         NOT NULL,
  "body"      TEXT         NOT NULL,
  "read"      BOOLEAN      NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_read_createdAt_idx"
  ON "notifications" ("userId", "read", "createdAt");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
