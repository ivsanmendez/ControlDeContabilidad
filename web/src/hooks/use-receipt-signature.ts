import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-client'

interface ReceiptPayment {
  month: number
  amount: number
  category_name: string
}

interface ReceiptData {
  folio: string
  contributor_id: number
  house_number: string
  contributor_name: string
  year: number
  payments: ReceiptPayment[]
  total: number
  signer_name: string
  generated_at: string
}

export interface ReceiptSignatureResponse {
  folio: string
  data: ReceiptData
  signature: string
  certificate: string
}

interface SignReceiptParams {
  contributor_id: number
  year: number
  password: string
  signer_name: string
}

export function useReceiptSignature() {
  return useMutation<ReceiptSignatureResponse, Error, SignReceiptParams>({
    mutationFn: (params) =>
      apiFetch<ReceiptSignatureResponse>('/contributions/receipt-signature', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
  })
}
