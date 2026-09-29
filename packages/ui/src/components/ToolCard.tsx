import React from 'react'
import { C, shadows, glass } from '@toolhub/config'
import { motion } from 'framer-motion'
import { ExternalLink, Heart, Pencil } from 'lucide-react'

interface ToolCardProps {
  name: string
  description: string
  icon: React.ReactNode
  url: string
  status?: 'active' | 'inactive' | 'new'
  categoryColor?: string
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onLaunch: () => void
  /** Dark premium card style. */
  featured?: boolean
  /** When provided, a pencil icon appears and triggers this callback (opens edit form). */
  onEdit?: () => void
}

export function ToolCard({
  name,
  description,
  icon,
  status = 'active',
  categoryColor = C.sand500,
  isFavorite = false,
  onToggleFavorite,
  onLaunch,
  featured = false,
  onEdit,
}: ToolCardProps) {
  if (featured) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: shadows.lg }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: `linear-gradient(145deg, ${C.sand700} 0%, ${C.sand900} 100%)`,
          borderRadius: '18px',
          padding: '28px 24px',
          minHeight: '220px',
          boxShadow: '0 6px 24px rgba(62,46,30,0.18), 0 2px 6px rgba(62,46,30,0.10)',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            right: '-15%',
            width: '180px',
            height: '180px',
            background: `radial-gradient(circle, ${categoryColor}25 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.sand100,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
              }}
            >
              {name}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {onToggleFavorite && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleFavorite()
                }}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  padding: 5,
                  display: 'flex',
                  borderRadius: '50%',
                }}
              >
                <Heart
                  size={16}
                  fill={isFavorite ? C.danger : 'none'}
                  color={isFavorite ? C.danger : 'rgba(255,255,255,0.45)'}
                  strokeWidth={2}
                />
              </motion.button>
            )}
            {onEdit && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                aria-label="Edit tool"
                title="Edit tool"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  padding: 5,
                  display: 'flex',
                  borderRadius: '50%',
                }}
              >
                <Pencil size={15} color="rgba(255,255,255,0.75)" strokeWidth={2} />
              </motion.button>
            )}
          </div>
        </div>

        <div style={{ marginTop: '14px', position: 'relative' }}>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
              margin: 0,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={(e) => {
            e.stopPropagation()
            onLaunch()
          }}
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            color: C.coffee800,
            border: 'none',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            justifyContent: 'center',
            fontFamily: 'inherit',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          Launch <ExternalLink size={14} />
        </motion.button>
      </motion.div>
    )
  }

  /* ── Standard light card ── */
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: shadows.md }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: glass.background,
        backdropFilter: glass.blur,
        border: glass.border,
        borderRadius: glass.borderRadius,
        padding: '24px 20px',
        minHeight: '210px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: shadows.sm,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: categoryColor,
          borderRadius: '4px 0 0 4px',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: `${categoryColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: categoryColor,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: C.coffee800,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {name}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {status === 'new' && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: C.info,
                background: C.infoBg,
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              NEW
            </span>
          )}
          {onToggleFavorite && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite()
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                borderRadius: '50%',
              }}
            >
              <Heart
                size={18}
                fill={isFavorite ? C.danger : 'none'}
                color={isFavorite ? C.danger : C.sand300}
                strokeWidth={2}
              />
            </motion.button>
          )}
          {onEdit && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              aria-label="Edit tool"
              title="Edit tool"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                borderRadius: '50%',
              }}
            >
              <Pencil size={16} color={C.sand500} strokeWidth={2} />
            </motion.button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <p
          style={{
            fontSize: '13px',
            color: C.sand600,
            margin: 0,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onLaunch()
        }}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: `linear-gradient(135deg, ${C.sand500}, ${C.sand600})`,
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          justifyContent: 'center',
          fontFamily: 'inherit',
        }}
      >
        Launch <ExternalLink size={14} />
      </button>
    </motion.div>
  )
}
