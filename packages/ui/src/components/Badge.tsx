import React from 'react'
import { C } from '@toolhub/config'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, color = C.sand700, bg = C.sand100, size = 'sm' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: '20px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 600,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
