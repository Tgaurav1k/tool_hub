import React from 'react'
import { C } from '@toolhub/config'

/**
 * Root error boundary. Catches render/commit crashes so the app never white-screens.
 * The common trigger here is browser autofill / temp-mail extensions injecting DOM
 * into our inputs, which makes React's commit phase throw (e.g. NotFoundError on
 * removeChild). We can't stop the extension, but we can recover gracefully.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('App crash caught by ErrorBoundary:', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.pageBg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.coffee800, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '14px', color: C.sand600, margin: 0, maxWidth: '420px' }}>
          A browser extension may have interfered with the page. Reload to continue — if it keeps
          happening, try disabling autofill/temp-mail extensions for this site.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: `linear-gradient(135deg, ${C.sand500}, ${C.sand600})`,
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
