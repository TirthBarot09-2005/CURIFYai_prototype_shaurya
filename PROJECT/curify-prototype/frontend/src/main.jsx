import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function ClerkWithRouter({ children }) {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={CLERK_KEY}
      navigate={(to) => navigate(to)}
      signInUrl="/auth"
      signUpUrl="/auth/sign-up"
      signInForceRedirectUrl="/auth/role"
      signUpForceRedirectUrl="/auth/role"
    >
      {children}
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkWithRouter>
        <App />
      </ClerkWithRouter>
    </BrowserRouter>
  </StrictMode>,
)