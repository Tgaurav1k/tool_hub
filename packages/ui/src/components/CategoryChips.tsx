import React from 'react'
import { C } from '@toolhub/config'

interface CategoryChip {
  id: string
  name: string
  colorToken?: string
}

interface CategoryChipsProps {
  categories: CategoryChip[]
  activeId: string | null
  onSelect: (id: string | null) => void
}

export function CategoryChips({ categories, activeId, onSelect }: CategoryChipsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '4px 0',
      }}
    >
      <button
        onClick={() => onSelect(null)}
        style={{
          padding: '6px 16px',
          borderRadius: '20px',
          border: `1.5px solid ${!activeId ? C.sand500 : C.sand200}`,
          background: !activeId ? `${C.sand500}15` : 'transparent',
          color: !activeId ? C.sand700 : C.sand600,
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
      >
        All
      </button>
      {categories.map((cat) => {
        const isActive = activeId === cat.id
        // Match "All" — use sand palette for active state (category colorToken is for cards elsewhere, not chips)
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: `1.5px solid ${isActive ? C.sand500 : C.sand200}`,
              background: isActive ? `${C.sand500}15` : 'transparent',
              color: isActive ? C.sand700 : C.sand600,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease',
            }}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
