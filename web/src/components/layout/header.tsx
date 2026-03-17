import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const navKeys = [
  { to: '/', key: 'nav.expenses' },
  { to: '/contributors', key: 'nav.contributors' },
  { to: '/contributions', key: 'nav.contributions' },
  { to: '/contribution-categories', key: 'nav.categories' },
  { to: '/expense-categories', key: 'nav.expenseCategories' },
  { to: '/reports/monthly-balance', key: 'nav.monthlyBalance' },
] as const

export function Header() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation('common')
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggleLanguage() {
    const next = i18n.language.startsWith('es') ? 'en' : 'es'
    i18n.changeLanguage(next)
  }

  const linkClass = (to: string) =>
    `text-sm font-medium transition-colors hover:text-foreground ${
      pathname === to ? 'text-foreground' : 'text-muted-foreground'
    }`

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">ARI ADMIN</span>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {navKeys.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={toggleLanguage}>
            {i18n.language.startsWith('es') ? 'EN' : 'ES'}
          </Button>
          <Button variant="outline" size="sm" onClick={logout} className="hidden md:inline-flex">
            {t('auth.logout')}
          </Button>
          {/* Hamburger */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden px-2"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4">
          <nav className="flex flex-col pt-2">
            {navKeys.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`py-2.5 border-b last:border-b-0 ${linkClass(link.to)}`}
                onClick={() => setMobileOpen(false)}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center justify-between pt-4 mt-2 border-t">
            <span className="text-sm text-muted-foreground truncate max-w-[180px]">{user?.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { logout(); setMobileOpen(false) }}
            >
              {t('auth.logout')}
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}