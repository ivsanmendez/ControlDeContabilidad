import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateContributor, useUpdateContributor } from '@/hooks/use-contributors'
import { useHouses } from '@/hooks/use-houses'
import { ApiClientError } from '@/lib/api-client'
import type { Contributor } from '@/types/contributor'
import type { House } from '@/types/house'

const NO_HOUSE = '__none__'

type ContributorFormProps = {
  contributor?: Contributor
  onSuccess: () => void
}

export function ContributorForm({ contributor, onSuccess }: ContributorFormProps) {
  const isEdit = !!contributor
  const createContributor = useCreateContributor()
  const updateContributor = useUpdateContributor()
  const { t } = useTranslation('contributors')
  const { data: houses } = useHouses()

  // Create: '' = nothing chosen yet (submit blocked).
  const [selectedHouseID, setSelectedHouseID] = useState<string>('')

  // Edit: track selected house ID; NO_HOUSE means "clear the assignment".
  const [editHouseID, setEditHouseID] = useState<string>(
    contributor?.HouseID != null ? String(contributor.HouseID) : NO_HOUSE
  )

  const [name, setName] = useState(contributor?.Name ?? '')
  const [phone, setPhone] = useState(contributor?.Phone ?? '')
  const [cameraAccess, setCameraAccess] = useState(contributor?.CameraAccess ?? false)
  const [cameraEmail, setCameraEmail] = useState(contributor?.CameraEmail ?? '')
  const [cameraPhone, setCameraPhone] = useState(contributor?.CameraPhone ?? '')
  const [error, setError] = useState('')

  function findHouse(id: string): House | undefined {
    return (houses ?? []).find((h) => String(h.ID) === id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (isEdit) {
        const house = editHouseID !== NO_HOUSE ? findHouse(editHouseID) : undefined
        await updateContributor.mutateAsync({
          id: contributor!.ID,
          data: {
            house_number: house ? house.Name : contributor!.HouseNumber,
            name,
            phone,
            house_id: house ? house.ID : null,
            camera_access: cameraAccess,
            camera_email: cameraAccess ? cameraEmail : '',
            camera_phone: cameraAccess ? cameraPhone : '',
          },
        })
      } else {
        const house = findHouse(selectedHouseID)!
        await createContributor.mutateAsync({
          house_number: house.Name,
          name,
          phone,
          house_id: house.ID,
          camera_access: cameraAccess,
          camera_email: cameraAccess ? cameraEmail : '',
          camera_phone: cameraAccess ? cameraPhone : '',
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
          <Label htmlFor="house">{t('form.house')}</Label>

          {isEdit ? (
            <Select value={editHouseID} onValueChange={(v) => setEditHouseID(v ?? NO_HOUSE)}>
              <SelectTrigger id="house">
                <SelectValue placeholder={t('form.noHouse')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_HOUSE} label={t('form.noHouse')}>
                  {t('form.noHouse')}
                </SelectItem>
                {(houses ?? []).map((h) => (
                  <SelectItem key={h.ID} value={String(h.ID)} label={h.Name}>
                    {h.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={selectedHouseID} onValueChange={(v) => setSelectedHouseID(v ?? '')}>
              <SelectTrigger id="house">
                <SelectValue placeholder={t('form.selectHouse')} />
              </SelectTrigger>
              <SelectContent>
                {(houses ?? []).map((h) => (
                  <SelectItem key={h.ID} value={String(h.ID)} label={h.Name}>
                    {h.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

        <div className="flex items-center gap-2 pt-1">
          <input
            id="camera-access"
            type="checkbox"
            className="h-4 w-4 accent-primary cursor-pointer"
            checked={cameraAccess}
            onChange={(e) => setCameraAccess(e.target.checked)}
          />
          <Label htmlFor="camera-access" className="cursor-pointer font-normal">
            {t('form.cameraAccess')}
          </Label>
        </div>

        {cameraAccess && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="camera-email">{t('form.cameraEmail')}</Label>
              <Input
                id="camera-email"
                type="email"
                value={cameraEmail}
                onChange={(e) => setCameraEmail(e.target.value)}
                placeholder={t('form.cameraEmailPlaceholder')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="camera-phone">{t('form.cameraPhone')}</Label>
              <Input
                id="camera-phone"
                type="tel"
                value={cameraPhone}
                onChange={(e) => setCameraPhone(e.target.value)}
                placeholder={t('form.cameraPhonePlaceholder')}
              />
            </div>
          </>
        )}

        <Button type="submit" disabled={isPending || (!isEdit && !selectedHouseID)}>
          {isPending
            ? (isEdit ? t('form.submittingEdit') : t('form.submittingCreate'))
            : (isEdit ? t('form.submitEdit') : t('form.submitCreate'))}
        </Button>
      </form>
    </DialogContent>
  )
}