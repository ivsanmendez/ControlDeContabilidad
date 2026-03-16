import { Navigate } from 'react-router-dom'
import { LoginForm } from '@/components/auth/login-form'
import { useAuth } from '@/hooks/use-auth'

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm />
    </div>
  )
}
