-- CreateTable
CREATE TABLE "roles" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("slug")
);

-- Canonical roles (must exist before FK from users.role)
INSERT INTO "roles" ("slug", "label", "description", "sortOrder") VALUES
  ('superadmin', 'Super Admin', 'Full system access; manages admins, tools, catalog, and all users', 1),
  ('admin', 'Admin', 'Creates users and assigns categories within their own scope', 2),
  ('user', 'User', 'Accesses tools based on categories assigned by an admin', 3);

-- Enforce users.role to reference a valid role slug
ALTER TABLE "users" ADD CONSTRAINT "users_role_fkey" FOREIGN KEY ("role") REFERENCES "roles"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;
