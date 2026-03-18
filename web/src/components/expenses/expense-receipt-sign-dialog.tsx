import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useExpenseReceiptSignature } from '@/hooks/use-expense-receipt-signature'
import { ApiClientError } from '@/lib/api-client'
import type { ExpenseReceiptSignatureResponse } from '@/types/expense'

type ExpenseReceiptSignDialogProps = {
  expenseId: number
  onSuccess: (signerName: string, data: ExpenseReceiptSignatureResponse) => void
}

export function ExpenseReceiptSignDialog({ expenseId, onSuccess }: ExpenseReceiptSignDialogProps) {
  const signMutation = useExpenseReceiptSignature()
  const { t } = useTranslation('expenses')

  const [signerName, setSignerName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const result = await signMutation.mutateAsync({
        expenseId,
        password,
        signer_name: signerName,
      })
      onSuccess(signerName, result)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(t('receipt.errorSign'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('receipt.signAndPrint')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="signerName">{t('receipt.signerName')}</Label>
          <Input
            id="signerName"
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder={t('receipt.signerNamePlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="certPassword">{t('receipt.certPassword')}</Label>
          <Input
            id="certPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('receipt.certPasswordPlaceholder')}
          />
        </div>
        <Button type="submit" disabled={signMutation.isPending}>
          {signMutation.isPending ? t('receipt.signing') : t('receipt.signAndPrint')}
        </Button>
      </form>
    </DialogContent>
  )
}
