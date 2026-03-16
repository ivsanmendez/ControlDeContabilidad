import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

const LoginPage = lazy(() => import('@/pages/login-page').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/register-page').then(m => ({ default: m.RegisterPage })))
const ExpensesPage = lazy(() => import('@/pages/expenses-page').then(m => ({ default: m.ExpensesPage })))
const ContributorsPage = lazy(() => import('@/pages/contributors-page').then(m => ({ default: m.ContributorsPage })))
const ContributionsPage = lazy(() => import('@/pages/contributions-page').then(m => ({ default: m.ContributionsPage })))
const ContributionCategoriesPage = lazy(() => import('@/pages/contribution-categories-page').then(m => ({ default: m.ContributionCategoriesPage })))
const ExpenseCategoriesPage = lazy(() => import('@/pages/expense-categories-page').then(m => ({ default: m.ExpenseCategoriesPage })))
const ContributionReceiptPage = lazy(() => import('@/pages/contribution-receipt-page').then(m => ({ default: m.ContributionReceiptPage })))
const MonthlyBalancePage = lazy(() => import('@/pages/monthly-balance-page').then(m => ({ default: m.MonthlyBalancePage })))

function App() {
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  )
}

export default App
