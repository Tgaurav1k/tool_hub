import React from 'react'
import { C, glass, shadows } from '@toolhub/config'

export function SkeletonCard() {
  return (
    <div
      style={{
        background: glass.background,
        backdropFilter: glass.blur,
        border: glass.border,
        borderRadius: glass.borderRadius,
        padding: '20px',
        boxShadow: shadows.sm,
      }}
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: C.sand100,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              width: '60%',
              height: 14,
              borderRadius: '4px',
              background: C.sand100,
              marginBottom: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: '80%',
              height: 12,
              borderRadius: '4px',
              background: C.sand50,
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: 36,
          borderRadius: '8px',
          background: C.sand100,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}
