import { useEffect, useState } from 'react'

function readInitial(): boolean {
  try {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  } catch {
    return false
  }
}

/**
 * Tracks the Sidebar component's collapsed state in the current tab.
 * The Sidebar writes to localStorage and dispatches
 * `toolhub:sidebar-collapsed-change`; we also listen to `storage` for
 * cross-tab updates.
 */
export function useSidebarCollapsed(): boolean {
  const [collapsed, setCollapsed] = useState<boolean>(readInitial)

  useEffect(() => {
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ collapsed?: boolean }>).detail
      if (typeof detail?.collapsed === 'boolean') {
        setCollapsed(detail.collapsed)
      } else {
        setCollapsed(readInitial())
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== 'sidebar-collapsed') return
      setCollapsed(readInitial())
    }
    window.addEventListener('toolhub:sidebar-collapsed-change', onCustom as EventListener)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('toolhub:sidebar-collapsed-change', onCustom as EventListener)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return collapsed
}
