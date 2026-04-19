import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAssignContributor } from '@/hooks/use-houses'
import { useContributors } from '@/hooks/use-contributors'
import { ApiClientError } from '@/lib/api-client'
import type { ContributorSummary } from '@/types/house'

type HouseAssignDialogProps = {
  houseID: number
  assigned: ContributorSummary[] | null
  onSuccess: () => void
}

export function HouseAssignDialog({ houseID, assigned, onSuccess }: HouseAssignDialogProps) {
  const { t } = useTranslation('houses')
  const assignContributor = useAssignContributor()
  const { data: allContributors } = useContributors()
  const [contributorID, setContributorID] = useState('')
  const [error, setError] = useState('')

  const assignedIDs = new Set((assigned ?? []).map((c) => c.ID))
  const available = (allContributors ?? []).filter((c) => !assignedIDs.has(c.ID))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await assignContributor.mutateAsync({ houseID, contributorID: parseInt(contributorID, 10) })
      setContributorID('')
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(t('assign.error'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('assign.title')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="assign-contributor">{t('assign.contributor')}</Label>
          <Select value={contributorID} onValueChange={(v) => setContributorID(v ?? '')} required>
            <SelectTrigger id="assign-contributor">
              <SelectValue placeholder={t('assign.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.ID} value={String(c.ID)}>
                  {c.HouseNumber} — {c.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={assignContributor.isPending || !contributorID}>
          {assignContributor.isPending ? t('form.submitting') : t('assign.submit')}
        </Button>
      </form>
    </DialogContent>
  )
}