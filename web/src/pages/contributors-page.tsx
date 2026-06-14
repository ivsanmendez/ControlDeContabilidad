import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContributorTable } from '@/components/contributors/contributor-table'
import { ContributorForm } from '@/components/contributors/contributor-form'
import { ContributorEmpty } from '@/components/contributors/contributor-empty'
import { useContributors, useDeleteContributor } from '@/hooks/use-contributors'
import { useHouses } from '@/hooks/use-houses'
import type { Contributor } from '@/types/contributor'

const ALL = '__all__'

export function ContributorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contributor | undefined>()
  const { t } = useTranslation('contributors')

  const [searchParams, setSearchParams] = useSearchParams()
  const houseIDParam = searchParams.get('house_id')
  const houseID = houseIDParam ? parseInt(houseIDParam, 10) : undefined

  const { data: contributors, isLoading, isError } = useContributors(houseID)
  const { data: houses } = useHouses()
  const deleteContributor = useDeleteContributor()

  function handleHouseChange(value: string) {
    if (value === ALL) {
      setSearchParams({})
    } else {
      setSearchParams({ house_id: value })
    }
  }

  function handleClear() {
    setSearchParams({})
  }

  function handleEdit(contributor: Contributor) {
    setEditing(contributor)
    setDialogOpen(true)
  }

  function handleDelete(id: number) {
    deleteContributor.mutate(id, {
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

  const selectedValue = houseIDParam ?? ALL

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger render={<Button />}>{t('newContributor')}</DialogTrigger>
          {dialogOpen && (
            <ContributorForm
              contributor={editing}
              onSuccess={() => {
                setDialogOpen(false)
                setEditing(undefined)
                toast.success(editing ? t('toast.updated') : t('toast.created'))
              }}
            />
          )}
        </Dialog>
      </div>

      {/* House filter */}
      <div className="flex items-center gap-2">
        <Select value={selectedValue} onValueChange={(v) => handleHouseChange(v ?? ALL)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('filter.allHouses')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('filter.allHouses')}</SelectItem>
            {(houses ?? []).map((h) => (
              <SelectItem key={h.ID} value={String(h.ID)}>
                {h.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {houseIDParam && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-1" />
            {t('filter.clear')}
          </Button>
        )}
      </div>

      {!contributors || contributors.length === 0 ? (
        <ContributorEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <ContributorTable
          contributors={contributors}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}