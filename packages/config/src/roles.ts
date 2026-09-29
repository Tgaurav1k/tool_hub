export type Role = 'superadmin' | 'admin' | 'user'

export interface RoleConfig {
  label: string
  description: string
  color: string
}

export const ROLES: Record<Role, RoleConfig> = {
  superadmin: {
    label: 'Super Admin',
    description: 'Full system access, manages admins, tools, and all users',
    color: '#B08D62',
  },
  admin: {
    label: 'Admin',
    description: 'Manages users and assigns categories within their scope',
    color: '#5B8A55',
  },
  user: {
    label: 'User',
    description: 'Accesses tools based on assigned categories',
    color: '#4A7AB5',
  },
}

export const ROLE_REDIRECT: Record<Role, string> = {
  superadmin: '/dashboard',
  admin: '/dashboard',
  user: '/dashboard',
}
