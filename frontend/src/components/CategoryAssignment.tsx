import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { C } from '@toolhub/config'
import { categoriesApi, toolsApi } from '@toolhub/api-client'
import type { Tool } from '@toolhub/api-client'
import { getIconComponent } from '../utils/iconMap'

interface CategoryAssignmentProps {
  selectedCategories: Set<string>
  /** IDs the acting admin may assign; `null` means all categories (e.g. SuperAdmin). */
  adminCategoryIds: Set<string> | null
  onToggle: (categoryId: string) => void
  /** Non–linked tools the admin has checked for access within selected categories. */
  selectedExplicitTools: Set<string>
  onToggleTool: (toolId: string, checked: boolean) => void
  /**
   * Linked-tool access state keyed by toolId. Only provided when the acting admin
   * is allowed to manage linked tools (SuperAdmin). When provided, linked tools
   * also get an inline checkbox in the category view.
   */
  linkedToolAccess?: Record<string, { enabled: boolean; toolRole: 'user' | 'admin' }>
  onToggleLinkedTool?: (toolId: string, checked: boolean) => void
  /** Free-text tool filter from the top-bar search box. */
  search?: string
}

export default function CategoryAssignment({
  selectedCategories,
  adminCategoryIds,
  onToggle,
  selectedExplicitTools,
  onToggleTool,
  linkedToolAccess,
  onToggleLinkedTool,
  search = '',
}: CategoryAssignmentProps) {
  const { data: categoriesRes } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  })

  const q = search.trim().toLowerCase()

  // Only needed while searching: which categories contain a matching tool, so we
  // can hide categories with no match and expand the ones that do.
  const { data: allToolsRes } = useQuery({
    queryKey: ['tools', 'all'],
    queryFn: () => toolsApi.getTools(),
    enabled: q.length > 0,
  })

  const matchCategoryIds = useMemo(() => {
    if (!q) return null
    const ids = new Set<string>()
    for (const t of allToolsRes?.tools ?? []) {
      if (t.name.toLowerCase().includes(q)) ids.add(t.categoryId)
    }
    return ids
  }, [q, allToolsRes?.tools])

  const apiCategories = useMemo(() => {
    const list = categoriesRes?.categories ?? []
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [categoriesRes?.categories])

  const visibleCategories = q
    ? apiCategories.filter((cat) => matchCategoryIds?.has(cat.id))
    : apiCategories

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {q && visibleCategories.length === 0 && (
        <div style={{ padding: '16px', fontSize: '13px', color: C.sand500 }}>
          No tools match “{search.trim()}”.
        </div>
      )}
      {visibleCategories.map((cat) => {
        const tint = C.sand500
        const isSelected = selectedCategories.has(cat.id)
        const isDisabled = adminCategoryIds !== null && !adminCategoryIds.has(cat.id)
        const IconComponent = getIconComponent(cat.icon)
        // While searching, expand every matching category so the hits are visible.
        const isExpanded = isSelected || q.length > 0

        return (
          <div key={cat.id}>
            <button
              onClick={() => !isDisabled && onToggle(cat.id)}
              disabled={isDisabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${isSelected ? tint : C.sand200}`,
                background: isSelected ? `${tint}08` : 'transparent',
                color: isDisabled ? C.sand200 : C.coffee800,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.5 : 1,
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '6px',
                  border: `2px solid ${isSelected ? tint : C.sand200}`,
                  background: isSelected ? tint : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: `${tint}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tint,
                  flexShrink: 0,
                }}
              >
                <IconComponent size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{cat.name}</div>
                {isDisabled && (
                  <div style={{ fontSize: '11px', color: C.sand300 }}>
                    Not in your access scope
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <CategoryToolPreview
                  categoryId={cat.id}
                  tint={tint}
                  selectedExplicitTools={selectedExplicitTools}
                  onToggleTool={onToggleTool}
                  linkedToolAccess={linkedToolAccess}
                  onToggleLinkedTool={onToggleLinkedTool}
                  search={q}
                />
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

function CategoryToolPreview({
  categoryId,
  tint,
  selectedExplicitTools,
  onToggleTool,
  linkedToolAccess,
  onToggleLinkedTool,
  search = '',
}: {
  categoryId: string
  tint: string
  selectedExplicitTools: Set<string>
  onToggleTool: (toolId: string, checked: boolean) => void
  linkedToolAccess?: Record<string, { enabled: boolean; toolRole: 'user' | 'admin' }>
  onToggleLinkedTool?: (toolId: string, checked: boolean) => void
  search?: string
}) {
  const { data } = useQuery({
    queryKey: ['category-tools', categoryId],
    queryFn: () => categoriesApi.getCategoryTools(categoryId),
  })

  const q = search.trim().toLowerCase()
  const allTools: Tool[] = (data as { category?: { tools: Tool[] } })?.category?.tools ?? []
  const tools = q ? allTools.filter((t) => t.name.toLowerCase().includes(q)) : allTools

  if (tools.length === 0) {
    // While searching this collapses the category to nothing; the parent already
    // hides categories with no match, so this only guards the loading gap.
    if (q) return null
    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '12px 16px 12px 68px',
            fontSize: '13px',
            color: C.sand300,
          }}
        >
          No tools in this category yet
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          padding: '8px 0 4px 68px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {tools.map((tool) => {
          const ToolIcon = getIconComponent(tool.icon)
          const linkedOnly = !!tool.requiresToolAssignment
          const canToggleLinked = linkedOnly && !!linkedToolAccess && !!onToggleLinkedTool
          const checked = linkedOnly
            ? !!linkedToolAccess?.[tool.id]?.enabled
            : selectedExplicitTools.has(tool.id)
          const showCheckbox = !linkedOnly || canToggleLinked

          return (
            <div
              key={tool.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: `${tint}06`,
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {showCheckbox ? (
                  <button
                    type="button"
                    aria-label={checked ? `Remove access to ${tool.name}` : `Grant access to ${tool.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (linkedOnly) {
                        onToggleLinkedTool?.(tool.id, !checked)
                      } else {
                        onToggleTool(tool.id, !checked)
                      }
                    }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '5px',
                      border: `2px solid ${checked ? tint : C.sand200}`,
                      background: checked ? tint : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {checked && (
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div style={{ width: 20, flexShrink: 0 }} aria-hidden />
                )}
                <ToolIcon size={14} color={tint} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: C.coffee800,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {tool.name}
                  </span>
                  {linkedOnly && (
                    <span style={{ fontSize: '11px', color: C.sand500, display: 'block', marginTop: 2 }}>
                      {canToggleLinked
                        ? 'Linked access — set role in "Linked Tool Access" below'
                        : 'Linked access — use "Linked Tool Access" below'}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: tint,
                  textDecoration: 'none',
                  flexShrink: 0,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'inline-block',
                  }}
                >
                  {tool.url.replace(/^https?:\/\//, '')}
                </span>
                <ExternalLink size={12} />
              </a>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
