import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { LoginPage } from '@/pages/login-page'
import { RegisterPage } from '@/pages/register-page'
import { ExpensesPage } from '@/pages/expenses-page'
import { ContributorsPage } from '@/pages/contributors-page'
import { ContributionsPage } from '@/pages/contributions-page'
import { ContributionCategoriesPage } from '@/pages/contribution-categories-page'
import { ExpenseCategoriesPage } from '@/pages/expense-categories-page'
import { ContributionReceiptPage } from '@/pages/contribution-receipt-page'
import { MonthlyBalancePage } from '@/pages/monthly-balance-page'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<ExpensesPage />} />
          <Route path="/contributors" element={<ContributorsPage />} />
          <Route path="/contributions" element={<ContributionsPage />} />
          <Route path="/contribution-categories" element={<ContributionCategoriesPage />} />
          <Route path="/expense-categories" element={<ExpenseCategoriesPage />} />
          <Route path="/reports/monthly-balance" element={<MonthlyBalancePage />} />
        </Route>
        <Route path="/contributions/receipt" element={<ContributionReceiptPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
