import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const rawKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const publishableKey = typeof rawKey === 'string' ? rawKey.trim() : ''
const isValidKey = publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_')

if (!publishableKey || !isValidKey) {
  createRoot(document.getElementById('root')!).render(
    <div
      style={{
        display: 'flex',
        minHeight: '100dvh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#fff',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '32px' }}>⚙️</div>
      <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>
        {!publishableKey ? 'Missing environment setup' : 'Invalid Clerk key'}
      </h1>
      <p style={{ fontSize: '14px', color: '#6c6c6c', margin: 0, maxWidth: '360px', lineHeight: 1.6 }}>
        {!publishableKey
          ? "The app needs a Clerk publishable key. Create a .env.local from sample.env and set VITE_CLERK_PUBLISHABLE_KEY."
          : 'The key in .env.local must start with pk_test_ or pk_live_. Check the variable name is exactly VITE_CLERK_PUBLISHABLE_KEY (no typo), use the real key from Clerk, and restart the dev server.'}
      </p>
      <pre
        style={{
          backgroundColor: '#f4f4f4',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '13px',
          textAlign: 'left',
          margin: 0,
        }}
      >
        {'VITE_CLERK_PUBLISHABLE_KEY=pk_test_...'}
      </pre>
      <p style={{ fontSize: '13px', color: '#6c6c6c', margin: 0 }}>
        Find your key at{' '}
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noreferrer"
          style={{ color: '#39cc33' }}
        >
          dashboard.clerk.com
        </a>{' '}
        → API Keys, then restart the dev server.
      </p>
    </div>,
  )
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/splash">
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}
