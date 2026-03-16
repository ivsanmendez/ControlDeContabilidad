import type { TFunction } from 'i18next'
import type { PaymentMethod } from '@/types/contribution'

export const PAYMENT_METHODS: PaymentMethod[] = ['cash', 'transfer', 'other']

export function getPaymentMethodLabel(t: TFunction, method: PaymentMethod): string {
  return t(`common:paymentMethods.${method}`)
}

export function getMonthLabel(t: TFunction, month: number): string {
  return t(`common:months.${month}`)
}
