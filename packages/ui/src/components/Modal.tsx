import React from 'react'
import { C, glass, shadows } from '@toolhub/config'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Sticky below scrollable body (e.g. action buttons). */
  footer?: React.ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, footer, width = 480 }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 200 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              // Centre horizontally with auto margins rather than
              // `transform: translateX(-50%)`: Framer Motion drives `transform`
              // for the entrance animation and would otherwise clobber it,
              // pushing the modal off-centre (and off-screen on phones).
              left: 0,
              right: 0,
              margin: '0 auto',
              top: 'max(16px, env(safe-area-inset-top, 0px))',
              width: `min(${width}px, calc(100vw - 32px))`,
              maxHeight: 'calc(100vh - max(32px, env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)))',
              display: 'flex',
              flexDirection: 'column',
              background: glass.background,
              backdropFilter: glass.blur,
              WebkitBackdropFilter: glass.blur,
              border: glass.border,
              borderRadius: glass.borderRadius,
              boxShadow: shadows.lg,
              zIndex: 210,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                padding: '20px 24px 0',
              }}
            >
              <h2
                id="modal-title"
                style={{ fontSize: '18px', fontWeight: 700, color: C.coffee800, margin: 0 }}
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.sand600,
                  padding: '4px',
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '16px 24px',
                paddingBottom: footer ? 12 : 24,
              }}
            >
              {children}
            </div>
            {footer ? (
              <div
                style={{
                  flexShrink: 0,
                  padding: '12px 24px 20px',
                  borderTop: `1px solid ${C.sand100}`,
                  background: glass.background,
                }}
              >
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
