import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { HouseTable } from '@/components/houses/house-table'
import { HouseForm } from '@/components/houses/house-form'
import { useHouses, useDeleteHouse } from '@/hooks/use-houses'
import type { House } from '@/types/house'

export function HousesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<House | undefined>()
  const { t } = useTranslation('houses')

  const { data: houses, isLoading, isError } = useHouses()
  const deleteHouse = useDeleteHouse()

  function handleEdit(house: House) {
    setEditing(house)
    setDialogOpen(true)
  }

  function handleDelete(id: number) {
    deleteHouse.mutate(id, {
      onSuccess: () => toast.success(t('toast.deleted')),
      onError: (err) => toast.error(err.message || t('toast.errorDelete')),
    })
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditing(undefined)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <p className="py-12 text-center text-destructive">{t('toast.errorLoad')}</p>
  }

  const items = houses ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger render={<Button />}>{t('newHouse')}</DialogTrigger>
          {dialogOpen && (
            <HouseForm
              house={editing}
              onSuccess={() => {
                setDialogOpen(false)
                setEditing(undefined)
                toast.success(editing ? t('toast.updated') : t('toast.created'))
              }}
            />
          )}
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="mb-2">{t('empty')}</p>
          <Button variant="outline" onClick={() => setDialogOpen(true)}>
            {t('newHouse')}
          </Button>
        </div>
      ) : (
        <HouseTable houses={items} onEdit={handleEdit} onDelete={handleDelete} />
      )}
    </div>
  )
}