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
import { useCreateContributor, useUpdateContributor } from '@/hooks/use-contributors'
import { ApiClientError } from '@/lib/api-client'
import type { Contributor } from '@/types/contributor'

type ContributorFormProps = {
  contributor?: Contributor
  onSuccess: () => void
}

export function ContributorForm({ contributor, onSuccess }: ContributorFormProps) {
  const isEdit = !!contributor
  const createContributor = useCreateContributor()
  const updateContributor = useUpdateContributor()
  const { t } = useTranslation('contributors')

  const [houseNumber, setHouseNumber] = useState(contributor?.HouseNumber ?? '')
  const [name, setName] = useState(contributor?.Name ?? '')
  const [phone, setPhone] = useState(contributor?.Phone ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (isEdit) {
        await updateContributor.mutateAsync({
          id: contributor!.ID,
          data: { name, phone },
        })
      } else {
        await createContributor.mutateAsync({
          house_number: houseNumber,
          name,
          phone,
        })
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(isEdit ? t('form.errorUpdate') : t('form.errorCreate'))
      }
    }
  }

  const isPending = createContributor.isPending || updateContributor.isPending

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? t('form.titleEdit') : t('form.titleNew')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="houseNumber">{t('form.houseNumber')}</Label>
          <Input
            id="houseNumber"
            required
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
            placeholder={t('form.houseNumberPlaceholder')}
            disabled={isEdit}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">{t('form.name')}</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">{t('form.phone')}</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (isEdit ? t('form.submittingEdit') : t('form.submittingCreate'))
            : (isEdit ? t('form.submitEdit') : t('form.submitCreate'))}
        </Button>
      </form>
    </DialogContent>
  )
}
