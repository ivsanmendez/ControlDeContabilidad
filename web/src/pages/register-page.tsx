import { Navigate } from 'react-router-dom'
import { RegisterForm } from '@/components/auth/register-form'
import { useAuth } from '@/hooks/use-auth'

export function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </div>
  )
}
