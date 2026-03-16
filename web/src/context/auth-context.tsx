import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types/auth'
import { apiFetch, clearTokens, setTokens } from '@/lib/api-client'

export type AuthContextValue = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

function hasRefreshToken() {
  return localStorage.getItem('refresh_token') !== null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(hasRefreshToken)

  const fetchUser = useCallback(async () => {
    const u = await apiFetch<User>('/auth/me')
    setUser(u)
  }, [])

  useEffect(() => {
    if (!isLoading) return

    apiFetch<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        clearTokens()
      })
      .finally(() => setIsLoading(false))
  }, [isLoading])

  const login = useCallback(async (email: string, password: string) => {
    const pair = await apiFetch<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setTokens(pair)
    await fetchUser()
  }, [fetchUser])

  const register = useCallback(async (email: string, password: string) => {
    await apiFetch<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    await login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refresh_token')
    if (rt) {
      try {
        await apiFetch<undefined>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: rt }),
        })
      } catch {
        // Best-effort logout
      }
    }
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
