import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { CategoryTable } from '@/components/categories/category-table'
import { CategoryForm } from '@/components/categories/category-form'
import { CategoryEmpty } from '@/components/categories/category-empty'
import { useCategories, useDeleteCategory } from '@/hooks/use-categories'
import type { ContributionCategory } from '@/types/category'

export function ContributionCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContributionCategory | undefined>()
  const { t } = useTranslation('categories')

  const { data: categories, isLoading, isError } = useCategories()
  const deleteCategory = useDeleteCategory()

  function handleEdit(category: ContributionCategory) {
    setEditing(category)
    setDialogOpen(true)
  }

  function handleDelete(id: number) {
    deleteCategory.mutate(id, {
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
          <DialogTrigger render={<Button />}>{t('newCategory')}</DialogTrigger>
          {dialogOpen && (
            <CategoryForm
              category={editing}
              onSuccess={() => {
                setDialogOpen(false)
                setEditing(undefined)
                toast.success(editing ? t('toast.updated') : t('toast.created'))
              }}
            />
          )}
        </Dialog>
      </div>

      {!categories || categories.length === 0 ? (
        <CategoryEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <CategoryTable
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
