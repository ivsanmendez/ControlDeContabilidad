import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { ContributorTable } from '@/components/contributors/contributor-table'
import { ContributorForm } from '@/components/contributors/contributor-form'
import { ContributorEmpty } from '@/components/contributors/contributor-empty'
import { useContributors, useDeleteContributor } from '@/hooks/use-contributors'
import type { Contributor } from '@/types/contributor'

export function ContributorsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Contributor | undefined>()
  const { t } = useTranslation('contributors')

  const { data: contributors, isLoading, isError } = useContributors()
  const deleteContributor = useDeleteContributor()

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
