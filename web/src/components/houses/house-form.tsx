import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCreateHouse, useUpdateHouse } from '@/hooks/use-houses'
import { ApiClientError } from '@/lib/api-client'
import type { House } from '@/types/house'

type HouseFormProps = {
  house?: House
  onSuccess: () => void
}

export function HouseForm({ house, onSuccess }: HouseFormProps) {
  const createHouse = useCreateHouse()
  const updateHouse = useUpdateHouse()
  const { t } = useTranslation('houses')
  const [name, setName] = useState(house?.Name ?? '')
  const [address, setAddress] = useState(house?.Address ?? '')
  const [notes, setNotes] = useState(house?.Notes ?? '')
  const [error, setError] = useState('')

  const isEditing = !!house
  const isPending = createHouse.isPending || updateHouse.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (isEditing) {
        await updateHouse.mutateAsync({ id: house.ID, data: { name, address, notes } })
      } else {
        await createHouse.mutateAsync({ name, address, notes })
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(isEditing ? t('form.errorUpdate') : t('form.errorCreate'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? t('form.editTitle') : t('form.title')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="house-name">{t('form.name')}</Label>
          <Input
            id="house-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.namePlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="house-address">{t('form.address')}</Label>
          <Input
            id="house-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('form.addressPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="house-notes">{t('form.notes')}</Label>
          <Input
            id="house-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('form.notesPlaceholder')}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? t('form.submitting') : isEditing ? t('form.submitUpdate') : t('form.submit')}
        </Button>
      </form>
    </DialogContent>
  )
}