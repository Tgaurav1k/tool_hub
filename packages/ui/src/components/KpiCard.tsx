import React from 'react'
import { C, shadows, glass } from '@toolhub/config'
import { motion } from 'framer-motion'

interface KpiCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  sub?: string
}

export function KpiCard({ icon, label, value, trend, trendUp, sub }: KpiCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      style={{
        background: glass.background,
        backdropFilter: glass.blur,
        border: glass.border,
        borderRadius: glass.borderRadius,
        padding: '20px',
        boxShadow: shadows.sm,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: `${C.sand500}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: C.sand500,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: trendUp ? C.success : C.danger,
              background: trendUp ? C.successBg : C.dangerBg,
              padding: '2px 8px',
              borderRadius: '12px',
            }}
          >
            {trend}
          </span>
        )}
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: C.coffee800 }}>{value}</div>
        <div style={{ fontSize: '13px', color: C.sand600, marginTop: '2px' }}>{label}</div>
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: C.sand300, marginTop: '8px' }}>{sub}</div>
      )}
    </motion.div>
  )
}
