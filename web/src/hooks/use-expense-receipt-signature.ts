import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'
import type { ExpenseReceiptSignatureResponse } from '@/types/expense'

interface SignExpenseReceiptParams {
  expenseId: number
  password: string
  signer_name: string
}

export function useExpenseReceiptSignature() {
  return useMutation<ExpenseReceiptSignatureResponse, Error, SignExpenseReceiptParams>({
    mutationFn: ({ expenseId, ...body }) =>
      apiFetch<ExpenseReceiptSignatureResponse>(`/expenses/${expenseId}/receipt-signature`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}
