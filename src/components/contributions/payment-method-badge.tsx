import { useTranslation } from 'react-i18next'
import type { PaymentMethod } from '@/types/contribution'
import { getPaymentMethodLabel } from '@/lib/constants'

const methodColors: Record<PaymentMethod, string> = {
  cash: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  transfer: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const { t } = useTranslation()

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${methodColors[method]}`}>
      {getPaymentMethodLabel(t, method)}
    </span>
  )
}
