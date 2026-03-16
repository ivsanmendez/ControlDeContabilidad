import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

  function toggleLanguage() {
    const next = i18n.language.startsWith('es') ? 'en' : 'es'
    i18n.changeLanguage(next)
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <span className="text-lg font-semibold">ARI ADMIN</span>
          <nav className="flex items-center gap-4">
            {navKeys.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-foreground ${
                  pathname === link.to ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={toggleLanguage}>
            {i18n.language.startsWith('es') ? 'EN' : 'ES'}
          </Button>
          <Button variant="outline" size="sm" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </header>
  )
}
