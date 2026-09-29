import React from 'react'
import { C } from '@toolhub/config'
import { SearchX } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({
  icon = <SearchX size={48} />,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
        color: C.sand300,
      }}
    >
      <div style={{ marginBottom: '16px', opacity: 0.6 }}>{icon}</div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: C.sand600, margin: '0 0 4px 0' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '13px', color: C.sand300, margin: 0, maxWidth: 320 }}>
          {description}
        </p>
      )}
    </div>
  )
}
