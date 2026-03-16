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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories'
import { ApiClientError } from '@/lib/api-client'
import type { ContributionCategory } from '@/types/category'

type CategoryFormProps = {
  category?: ContributionCategory
  onSuccess: () => void
}

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const isEdit = !!category
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const { t } = useTranslation('categories')

  const [name, setName] = useState(category?.Name ?? '')
  const [description, setDescription] = useState(category?.Description ?? '')
  const [isActive, setIsActive] = useState(category?.IsActive ?? true)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      if (isEdit) {
        await updateCategory.mutateAsync({
          id: category!.ID,
          data: { name, description, is_active: isActive },
        })
      } else {
        await createCategory.mutateAsync({ name, description })
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

  const isPending = createCategory.isPending || updateCategory.isPending

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? t('form.titleEdit') : t('form.titleNew')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoryName">{t('form.name')}</Label>
          <Input
            id="categoryName"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('form.namePlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoryDescription">{t('form.description')}</Label>
          <Input
            id="categoryDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('form.descriptionPlaceholder')}
          />
        </div>
        {isEdit && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryActive">{t('form.status')}</Label>
            <Select value={isActive ? 'true' : 'false'} onValueChange={(v) => setIsActive(v === 'true')}>
              <SelectTrigger id="categoryActive">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t('status.active')}</SelectItem>
                <SelectItem value="false">{t('status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (isEdit ? t('form.submittingEdit') : t('form.submittingCreate'))
            : (isEdit ? t('form.submitEdit') : t('form.submitCreate'))}
        </Button>
      </form>
    </DialogContent>
  )
}
