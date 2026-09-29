import React, { useState } from 'react'
import { C, shadows } from '@toolhub/config'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: '16px', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: C.sand700,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.sand300,
              display: 'flex',
            }}
          >
            {icon}
          </div>
        )}
        <input
          style={{
            width: '100%',
            padding: icon ? '10px 12px 10px 40px' : '10px 12px',
            borderRadius: '10px',
            border: `1.5px solid ${error ? C.danger : focused ? C.sand500 : C.sand200}`,
            background: C.cardBg,
            fontSize: '14px',
            color: C.coffee800,
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: focused ? `0 0 0 3px rgba(176,141,98,0.1)` : 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            ...style,
          }}
          onFocus={(e) => {
            setFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: C.danger, marginTop: '4px', display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  )
}
