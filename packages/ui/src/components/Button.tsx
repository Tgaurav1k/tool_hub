import React from 'react'
import { C, shadows } from '@toolhub/config'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const styles: Record<string, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${C.sand500}, ${C.sand600})`,
    color: '#fff',
    border: 'none',
    boxShadow: shadows.primary,
  },
  secondary: {
    background: C.cardBg,
    color: C.sand700,
    border: `1px solid ${C.sand200}`,
  },
  ghost: {
    background: 'transparent',
    color: C.sand600,
    border: 'none',
  },
  danger: {
    background: C.danger,
    color: '#fff',
    border: 'none',
  },
}

const sizes = {
  sm: { padding: '6px 12px', fontSize: '13px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '12px 28px', fontSize: '15px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  style,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      style={{
        borderRadius: '10px',
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        transition: 'all 0.2s ease',
        width: fullWidth ? '100%' : undefined,
        fontFamily: 'inherit',
        ...styles[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}
