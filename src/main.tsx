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

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in document')
const root = createRoot(rootElement)

if (!publishableKey || !isValidKey) {
  root.render(
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
      <div className="text-[32px] leading-none">⚙️</div>
      <h1 className="m-0 text-[20px] font-semibold leading-tight">
        {!publishableKey ? 'Missing environment setup' : 'Invalid Clerk key'}
      </h1>
      <p className="m-0 max-w-[360px] text-sm leading-[1.6] text-muted-foreground">
        {!publishableKey
          ? "The app needs a Clerk publishable key. Create a .env.local from sample.env and set VITE_CLERK_PUBLISHABLE_KEY."
          : 'The key in .env.local must start with pk_test_ or pk_live_. Check the variable name is exactly VITE_CLERK_PUBLISHABLE_KEY (no typo), use the real key from Clerk, and restart the dev server.'}
      </p>
      <pre className="m-0 rounded-lg bg-muted px-4 py-3 text-left text-[13px]">
        {'VITE_CLERK_PUBLISHABLE_KEY=pk_test_...'}
      </pre>
      <p className="m-0 text-[13px] text-muted-foreground">
        Find your key at{' '}
        <a
          href="https://dashboard.clerk.com"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          dashboard.clerk.com
        </a>{' '}
        → API Keys, then restart the dev server.
      </p>
    </div>,
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/splash">
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}
