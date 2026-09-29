import React from 'react'
import { C, glass, shadows } from '@toolhub/config'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface DetailPanelProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function DetailPanel({ open, onClose, title, children }: DetailPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 'min(420px, 100vw)',
            height: '100vh',
            background: glass.background,
            backdropFilter: glass.blur,
            borderLeft: glass.border,
            boxShadow: shadows.lg,
            zIndex: 50,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: C.coffee800, margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: C.sand600,
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
