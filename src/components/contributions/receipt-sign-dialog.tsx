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
import { useReceiptSignature, type ReceiptSignatureResponse } from '@/hooks/use-receipt-signature'
import { ApiClientError } from '@/lib/api-client'

type ReceiptSignDialogProps = {
  contributorId: number
  year: number
  onSuccess: (signerName: string, data: ReceiptSignatureResponse) => void
}

export function ReceiptSignDialog({ contributorId, year, onSuccess }: ReceiptSignDialogProps) {
  const signMutation = useReceiptSignature()
  const { t } = useTranslation('contributions')

  const [signerName, setSignerName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      const result = await signMutation.mutateAsync({
        contributor_id: contributorId,
        year,
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
