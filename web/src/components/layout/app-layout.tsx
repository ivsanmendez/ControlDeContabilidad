import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/header'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
