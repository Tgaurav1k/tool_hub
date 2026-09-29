import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { C, SIDEBAR, CATEGORY_MAP, ROLES, type Role } from '@toolhub/config'
import { Sidebar, type SidebarItem, type SidebarCategoryDropdownItem, Badge, Button, Input } from '@toolhub/ui'
import {
  Home, Settings, User, Mail, Shield, FolderOpen, Pencil, Upload,
  Users, Activity, Wrench, Heart, LayoutGrid,
} from 'lucide-react'
import { usersApi } from '@toolhub/api-client'
import { useAppStore } from '../stores/appStore'
import { useAssignedTools } from '../hooks/useAssignedTools'
import { useIsMobile } from '../hooks/useIsMobile'
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed'
import { getIcon } from '../utils/iconMap'

export default function ProfilePage() {
  const user = useAppStore((s) => s.user)!
  const setUser = useAppStore((s) => s.setUser)
  const navigate = useNavigate()
  const location = useLocation()
  const { categories } = useAssignedTools()
  const isMobile = useIsMobile()
  const [activeSidebarId, setActiveSidebarId] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const sidebarCollapsed = useSidebarCollapsed()

  useEffect(() => {
    const path = location.pathname
    if (path === '/profile') setActiveSidebarId('profile')
  }, [location.pathname])

  const categoryDropdownItems: SidebarCategoryDropdownItem[] = useMemo(() => {
    return categories
      .filter((cat) => cat.name.toLowerCase() !== 'favorites')
      .map((cat) => {
        const cfgCat = CATEGORY_MAP[cat.name.toLowerCase()]
        const iconName = cfgCat?.icon ?? cat.icon
        return {
          id: cat.id,
          label: cat.name,
          icon: getIcon(iconName, { size: 18 }),
        }
      })
  }, [categories])

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const items: SidebarItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    ]

    if (user.role === 'superadmin') {
      items.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-tools', label: 'Tool catalogue', icon: <Wrench size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    } else if (user.role === 'admin') {
      items.push(
        { id: 'nav-users', label: 'Users', icon: <Users size={18} /> },
        { id: 'nav-activity', label: 'Activity', icon: <Activity size={18} /> },
      )
    }

    items.push({
      id: 'nav-favorites',
      label: 'Favorites',
      icon: <Heart size={18} />,
    })

    items.push({
      id: 'profile',
      label: 'Profile',
      icon: <Settings size={18} />,
    })

    return items
  }, [user.role])

  const handleSidebarClick = (id: string) => {
    setActiveSidebarId(id)
    if (id === 'nav-users') {
      navigate('/users')
      return
    }
    if (id === 'nav-tools') {
      navigate('/tools')
      return
    }
    if (id === 'nav-activity') {
      navigate('/activity')
      return
    }
    if (id === 'profile') return
    if (id === 'dashboard') {
      navigate('/dashboard')
      return
    }
    if (id === 'nav-favorites') {
      navigate('/dashboard')
      return
    }
    if (id.startsWith('cat-')) {
      navigate('/dashboard')
      return
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  const sidebarWidth = sidebarCollapsed ? SIDEBAR.collapsed : SIDEBAR.expanded

  const displayName = isEditing ? name : user.name
  const displayAvatarUrl = isEditing ? avatarUrl : user.avatarUrl
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const roleConfig = ROLES[user.role as Role] ?? ROLES.user

  const onSelectAvatarFile = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be up to 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleStartEdit = () => {
    setName(user.name)
    setAvatarUrl(user.avatarUrl ?? '')
    setError('')
    setMessage('')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setName(user.name)
    setAvatarUrl(user.avatarUrl ?? '')
    setError('')
    setMessage('')
    setIsEditing(false)
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await usersApi.updateMyProfile({
        name: name.trim(),
        avatarDataUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
      })
      setUser(res.user)
      setIsEditing(false)
      setMessage('Profile updated successfully.')
    } catch (e) {
      const err = e as Error
      setError(err.message || 'Unable to update profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.pageBg }}>
      <Sidebar
        items={sidebarItems}
        activeId={activeSidebarId}
        onItemClick={handleSidebarClick}
        onLogout={handleLogout}
        userRole={user.role}
        categoryDropdown={
          categoryDropdownItems.length > 0
            ? {
                triggerLabel: 'Categories',
                triggerIcon: <LayoutGrid size={18} />,
                items: categoryDropdownItems,
                anchorItemId: user.role === 'superadmin' ? 'nav-tools' : 'nav-favorites',
              }
            : undefined
        }
      />

      <div
        className="tb-main"
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <main className="tb-page" style={{ flex: 1, padding: '40px 32px', overflow: 'auto' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 700,
              color: C.coffee800,
              letterSpacing: '-0.02em',
              margin: '0 0 32px 0',
            }}
          >
            Profile
          </h1>

          <div
            className="tb-profile-card"
            style={{
              background: C.cardBg,
              borderRadius: '16px',
              border: `1px solid ${C.sand200}`,
              padding: '32px',
              maxWidth: 600,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
              {!isEditing ? (
                <Button variant="secondary" size="sm" onClick={handleStartEdit}>
                  <Pencil size={14} style={{ marginRight: 6 }} />
                  Edit Profile
                </Button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={isSaving || name.trim().length < 2}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: '#FDF0F0', color: C.danger, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: '#EFF8F2', color: C.success, padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
                {message}
              </div>
            )}

            <div
              className="tb-profile-head"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '32px',
                paddingBottom: '24px',
                borderBottom: `1px solid ${C.sand100}`,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  background: `${C.info}20`,
                  color: C.info,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                  />
                ) : (
                  initials
                )}
              </div>
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: C.coffee800,
                    margin: '0 0 4px 0',
                  }}
                >
                  {displayName}
                </h2>
                <Badge color={roleConfig.color} bg={`${roleConfig.color}15`} size="sm">
                  {roleConfig.label}
                </Badge>
                {isEditing && (
                  <div className="tb-profile-edit" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 320 }}>
                    <Input
                      label="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                    <Input
                      label="Profile Image Data (optional)"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Use upload below (or paste data:image/... string)"
                    />
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        color: C.sand600,
                        fontSize: 13,
                        cursor: 'pointer',
                        width: 'fit-content',
                      }}
                    >
                      <Upload size={14} />
                      Upload image
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => onSelectAvatarFile(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ProfileRow
                icon={<User size={16} color={C.sand500} />}
                label="Full Name"
                value={user.name}
              />
              <ProfileRow
                icon={<Mail size={16} color={C.sand500} />}
                label="Email"
                value={user.email}
              />
              <ProfileRow
                icon={<Shield size={16} color={C.sand500} />}
                label="Role"
                value={roleConfig.label}
              />
              <ProfileRow
                icon={<FolderOpen size={16} color={C.sand500} />}
                label="Assigned Categories"
                value={
                  categories.length > 0
                    ? categories.map((c) => c.name).join(', ')
                    : 'No categories assigned'
                }
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: `${C.sand500}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: C.sand300,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '2px',
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: C.coffee800 }}>
          {value}
        </div>
      </div>
    </div>
  )
}
