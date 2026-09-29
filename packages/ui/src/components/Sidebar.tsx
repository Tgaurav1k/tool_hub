import React, { useState, useEffect, useMemo } from 'react'
import { C, shadows, SIDEBAR, sidebarChrome, BRAND_LOGO_URL } from '@toolhub/config'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ChevronDown, LogOut, X, Menu } from 'lucide-react'

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick?: () => void
}

export interface SidebarCategoryDropdownItem {
  id: string
  label: string
  icon: React.ReactNode
}

export interface SidebarCategoryDropdownConfig {
  triggerLabel: string
  triggerIcon: React.ReactNode
  items: SidebarCategoryDropdownItem[]
  /** Render the dropdown immediately before the sidebar item with this id. Defaults to 'nav-tools'. */
  anchorItemId?: string
}

interface SidebarProps {
  items: SidebarItem[]
  activeId: string
  onItemClick: (id: string) => void
  appName?: string
  onLogout: () => void
  userRole?: string
  /** When set, a “Categories” control is rendered immediately before the Tool catalogue item; items expand inline in the sidebar nav list. */
  categoryDropdown?: SidebarCategoryDropdownConfig
  /**
   * Brand mark in the sidebar orb. Defaults to `BRAND_LOGO_URL` (see `BRAND_LOGO_FILE` in config).
   * Pass `null` to force initials only.
   */
  brandLogoSrc?: string | null
}

function isSecondaryNavItem(id: string) {
  return (
    id.startsWith('cat-') ||
    id === 'profile' ||
    id.includes('category=')
  )
}

function brandMark(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'TH'
}

const asideBase: React.CSSProperties = {
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100,
  overflowX: 'hidden',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
  background: sidebarChrome.surface,
  backdropFilter: sidebarChrome.blur,
  WebkitBackdropFilter: sidebarChrome.blur,
  boxShadow: sidebarChrome.railShadow,
  borderRight: sidebarChrome.border,
}

function SidebarCategoryDropdownBlock({
  collapsed,
  isMobile,
  config,
  activeId,
  onItemClick,
  closeMobileDrawer,
}: {
  collapsed: boolean
  isMobile: boolean
  config: SidebarCategoryDropdownConfig
  activeId: string
  onItemClick: (id: string) => void
  closeMobileDrawer: () => void
}) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const triggerActive = config.items.some((it) => activeId === `cat-${it.id}`)

  const categoryListStyle: React.CSSProperties = {
    marginTop: 4,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    position: 'relative',
  }

  return (
    <div style={{ width: '100%', flexShrink: 0 }}>
      <motion.button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        whileHover={{
          scale: 1.015,
          boxShadow:
            open || triggerActive
              ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
              : '0 4px 14px rgba(69, 54, 34, 0.08), 0 1px 0 rgba(255,255,255,0.55)',
          backgroundColor: sidebarChrome.navHover,
        }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 12,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '11px 10px' : '11px 14px',
          borderRadius: 999,
          border: `1px solid ${open || triggerActive ? 'rgba(176, 141, 98, 0.35)' : 'transparent'}`,
          background:
            open || triggerActive ? sidebarChrome.navActive : 'rgba(255, 253, 249, 0.25)',
          color: triggerActive || open ? C.coffee800 : C.sand700,
          fontSize: 14,
          fontWeight: 600,
          opacity: 0.92,
          cursor: 'pointer',
          fontFamily: 'inherit',
          width: '100%',
          textAlign: 'left',
          boxShadow:
            open || triggerActive
              ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
              : '0 1px 0 rgba(255,255,255,0.4)',
        }}
        title={collapsed ? config.triggerLabel : undefined}
      >
        <span style={{ display: 'flex', flexShrink: 0, color: C.sand600 }}>{config.triggerIcon}</span>
        {!collapsed && (
          <>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {config.triggerLabel}
            </span>
            <ChevronDown
              size={16}
              strokeWidth={2.25}
              style={{
                flexShrink: 0,
                transform: open ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
                color: C.sand600,
              }}
              aria-hidden
            />
          </>
        )}
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="category-list"
            role="listbox"
            aria-label="Categories"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={categoryListStyle}>
              {!collapsed && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    left: 18,
                    top: 6,
                    bottom: 6,
                    width: 1.5,
                    background: 'linear-gradient(180deg, rgba(176, 141, 98, 0.0) 0%, rgba(176, 141, 98, 0.28) 18%, rgba(176, 141, 98, 0.28) 82%, rgba(176, 141, 98, 0.0) 100%)',
                    borderRadius: 2,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {config.items.map((row, idx) => {
                const rowActive = activeId === `cat-${row.id}`
                return (
                  <motion.button
                    key={row.id}
                    type="button"
                    role="option"
                    aria-selected={rowActive}
                    title={collapsed ? row.label : undefined}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 + idx * 0.025, duration: 0.18 }}
                    whileHover={{
                      scale: 1.015,
                      x: collapsed ? 0 : 2,
                      boxShadow: rowActive
                        ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
                        : '0 4px 12px rgba(69, 54, 34, 0.08), 0 1px 0 rgba(255,255,255,0.55)',
                      backgroundColor: rowActive ? sidebarChrome.navActive : sidebarChrome.navHover,
                    }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => {
                      onItemClick(`cat-${row.id}`)
                      if (isMobile) closeMobileDrawer()
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '9px 8px' : '9px 14px 9px 26px',
                      borderRadius: 999,
                      border: `1px solid ${rowActive ? 'rgba(176, 141, 98, 0.35)' : 'transparent'}`,
                      background: rowActive ? sidebarChrome.navActive : 'rgba(255, 253, 249, 0.25)',
                      color: rowActive ? C.coffee800 : C.sand700,
                      fontSize: 13,
                      fontWeight: rowActive ? 600 : 500,
                      opacity: rowActive ? 1 : 0.92,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      width: '100%',
                      textAlign: 'left',
                      boxShadow: rowActive
                        ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
                        : '0 1px 0 rgba(255,255,255,0.4)',
                    }}
                  >
                    {!collapsed && (
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: rowActive ? C.sand900 : 'rgba(176, 141, 98, 0.55)',
                          transform: 'translateY(-50%)',
                          transition: 'background 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: rowActive
                            ? '0 0 0 3px rgba(253, 248, 243, 1), 0 0 0 5px rgba(176, 141, 98, 0.22)'
                            : '0 0 0 3px rgba(253, 248, 243, 1)',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <span style={{ display: 'flex', flexShrink: 0, color: rowActive ? C.sand900 : C.sand600 }}>{row.icon}</span>
                    {!collapsed && (
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.label}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Sidebar({
  items,
  activeId,
  onItemClick,
  appName = 'Tool HUB',
  onLogout,
  categoryDropdown,
  brandLogoSrc,
}: SidebarProps) {
  const resolvedBrandLogo =
    brandLogoSrc === null ? null : (brandLogoSrc ?? BRAND_LOGO_URL)
  const [brandLogoFailed, setBrandLogoFailed] = useState(false)

  useEffect(() => {
    setBrandLogoFailed(false)
  }, [resolvedBrandLogo])

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const mark = useMemo(() => brandMark(appName), [appName])
  const drawerWidth = Math.max(SIDEBAR.expanded, 280)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent('toolhub:sidebar-collapsed-change', { detail: { collapsed } }),
      )
    } catch {}
  }, [collapsed])

  const width = collapsed ? SIDEBAR.collapsed : SIDEBAR.expanded

  const iconOrbSize = collapsed ? 36 : 40
  const iconFontSize = collapsed ? 13 : 15

  const sidebarContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: collapsed ? '14px 8px' : '18px 14px',
        minHeight: 0,
      }}
    >
      <style>{`
        .toolhub-sidebar-nav { scrollbar-width: thin; scrollbar-color: rgba(176, 141, 98, 0.28) transparent; }
        .toolhub-sidebar-nav::-webkit-scrollbar { width: 6px; }
        .toolhub-sidebar-nav::-webkit-scrollbar-track { background: transparent; }
        .toolhub-sidebar-nav::-webkit-scrollbar-thumb { background: rgba(176, 141, 98, 0.25); border-radius: 999px; }
        .toolhub-sidebar-nav::-webkit-scrollbar-thumb:hover { background: rgba(176, 141, 98, 0.45); }
      `}</style>
      {/* Brand — frosted card + orb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
          marginBottom: 18,
          minHeight: 44,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 12,
            flex: 1,
            minWidth: 0,
            padding: collapsed ? 4 : '10px 12px',
            borderRadius: 14,
            background: sidebarChrome.brandCard,
            border: sidebarChrome.border,
            boxShadow: sidebarChrome.brandShadow,
            backdropFilter: sidebarChrome.blur,
            WebkitBackdropFilter: sidebarChrome.blur,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: iconOrbSize,
              height: iconOrbSize,
              borderRadius: '50%',
              background: resolvedBrandLogo && !brandLogoFailed ? C.sand50 : sidebarChrome.iconOrb,
              color: '#FFFBF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: iconFontSize,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(69, 54, 34, 0.25), inset 0 1px 0 rgba(255,255,255,0.35)',
              overflow: 'hidden',
            }}
            aria-hidden
          >
            {resolvedBrandLogo && !brandLogoFailed ? (
              <img
                src={resolvedBrandLogo}
                alt=""
                onError={() => setBrandLogoFailed(true)}
                style={{
                  width: '78%',
                  height: '78%',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            ) : (
              mark
            )}
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: '1.125rem',
                fontWeight: 800,
                color: C.coffee800,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {appName}
            </span>
          )}
        </div>
        {!isMobile && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              flexShrink: 0,
              marginLeft: collapsed ? 0 : 8,
              background: sidebarChrome.brandCard,
              border: sidebarChrome.border,
              cursor: 'pointer',
              color: C.sand700,
              padding: '8px',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadows.sm,
              backdropFilter: sidebarChrome.blur,
              WebkitBackdropFilter: sidebarChrome.blur,
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </motion.button>
        )}
        {isMobile && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{
              flexShrink: 0,
              marginLeft: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: C.sand700,
              padding: 8,
              borderRadius: 10,
              display: 'flex',
            }}
          >
            <X size={20} />
          </motion.button>
        )}
      </div>

      <nav
        className="toolhub-sidebar-nav"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'visible',
          paddingRight: 4,
          paddingLeft: 2,
          marginBottom: 12,
        }}
      >
        {items.map((item) => (
          <React.Fragment key={item.id}>
            {categoryDropdown && item.id === (categoryDropdown.anchorItemId ?? 'nav-tools') && (
              <SidebarCategoryDropdownBlock
                collapsed={collapsed}
                isMobile={isMobile}
                config={categoryDropdown}
                activeId={activeId}
                onItemClick={onItemClick}
                closeMobileDrawer={() => setMobileOpen(false)}
              />
            )}
            <motion.button
              type="button"
              whileHover={{
                scale: 1.015,
                boxShadow: item.id === activeId
                  ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
                  : '0 4px 14px rgba(69, 54, 34, 0.08), 0 1px 0 rgba(255,255,255,0.55)',
                backgroundColor:
                  item.id === activeId ? sidebarChrome.navActive : sidebarChrome.navHover,
              }}
              whileTap={{ scale: 0.985 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              onClick={() => {
                onItemClick(item.id)
                if (isMobile) setMobileOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '11px 10px' : '11px 14px',
                borderRadius: 999,
                border: `1px solid ${item.id === activeId ? 'rgba(176, 141, 98, 0.35)' : 'transparent'}`,
                background: item.id === activeId ? sidebarChrome.navActive : 'rgba(255, 253, 249, 0.25)',
                color: item.id === activeId ? C.coffee800 : C.sand700,
                fontSize: isSecondaryNavItem(item.id) ? 13 : 14,
                fontWeight: item.id === activeId ? 600 : isSecondaryNavItem(item.id) ? 500 : 600,
                opacity: isSecondaryNavItem(item.id) && item.id !== activeId ? 0.92 : 1,
                cursor: 'pointer',
                fontFamily: 'inherit',
                width: '100%',
                textAlign: 'left',
                boxShadow:
                  item.id === activeId
                    ? 'inset 0 2px 6px rgba(69, 54, 34, 0.12), 0 1px 0 rgba(255,255,255,0.5)'
                    : '0 1px 0 rgba(255,255,255,0.4)',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span
                style={{
                  display: 'flex',
                  flexShrink: 0,
                  color: item.id === activeId ? C.sand900 : C.sand600,
                }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </motion.button>
          </React.Fragment>
        ))}
      </nav>

      <div
        style={{
          marginTop: 'auto',
          padding: collapsed ? '8px 4px' : '10px 10px',
          borderRadius: 16,
          background: sidebarChrome.footerCard,
          border: sidebarChrome.border,
          boxShadow: sidebarChrome.brandShadow,
          backdropFilter: sidebarChrome.blur,
          WebkitBackdropFilter: sidebarChrome.blur,
        }}
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 8px' : '10px 12px',
            borderRadius: 12,
            border: 'none',
            background: 'rgba(253, 240, 240, 0.45)',
            color: C.danger,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <LogOut size={collapsed ? 20 : 18} strokeWidth={2.25} />
          {!collapsed && <span>Logout</span>}
        </motion.button>
      </div>
    </div>
  )

  const desktopRadius: React.CSSProperties = {
    borderRadius: '0 20px 20px 0',
  }

  if (isMobile) {
    return (
      <>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 90,
            background: sidebarChrome.brandCard,
            border: sidebarChrome.border,
            borderRadius: 14,
            padding: 10,
            cursor: 'pointer',
            boxShadow: shadows.md,
            backdropFilter: sidebarChrome.blur,
            WebkitBackdropFilter: sidebarChrome.blur,
            display: 'flex',
          }}
          aria-label="Open menu"
        >
          <Menu size={22} color={C.coffee800} strokeWidth={2} />
        </motion.button>
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(44, 32, 22, 0.35)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  zIndex: 110,
                }}
              />
              <motion.aside
                initial={{ x: -drawerWidth }}
                animate={{ x: 0 }}
                exit={{ x: -drawerWidth }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                style={{
                  ...asideBase,
                  width: drawerWidth,
                  zIndex: 120,
                  borderRadius: '0 18px 18px 0',
                }}
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <motion.aside
      animate={{ width }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      style={{
        ...asideBase,
        ...desktopRadius,
        zIndex: 40,
      }}
    >
      {sidebarContent}
    </motion.aside>
  )
}
