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
import { useUpdateExpense } from '@/hooks/use-expenses'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { ApiClientError } from '@/lib/api-client'
import type { Expense } from '@/types/expense'

type ExpenseEditFormProps = {
  expense: Expense
  onSuccess: () => void
}

export function ExpenseEditForm({ expense, onSuccess }: ExpenseEditFormProps) {
  const updateExpense = useUpdateExpense()
  const { data: categories } = useExpenseCategories()
  const { t } = useTranslation('expenses')
  const [description, setDescription] = useState(expense.Description)
  const [amount, setAmount] = useState(String(expense.Amount))
  const [categoryId, setCategoryId] = useState(String(expense.CategoryID))
  const [date, setDate] = useState(expense.Date.slice(0, 10))
  const [error, setError] = useState('')

  const activeCategories = categories?.filter((c) => c.IsActive) ?? []

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await updateExpense.mutateAsync({
        id: expense.ID,
        data: {
          description,
          amount: parseFloat(amount),
          category_id: parseInt(categoryId, 10),
          date,
        },
      })
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(t('form.errorUpdate'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('form.editTitle')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-description">{t('form.description')}</Label>
          <Input
            id="edit-description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-amount">{t('form.amount')}</Label>
          <Input
            id="edit-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-category">{t('form.category')}</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')} required>
            <SelectTrigger id="edit-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeCategories.map((c) => (
                <SelectItem key={c.ID} value={String(c.ID)}>
                  {c.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="edit-date">{t('form.date')}</Label>
          <Input
            id="edit-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={updateExpense.isPending}>
          {updateExpense.isPending ? t('form.submitting') : t('form.submitUpdate')}
        </Button>
      </form>
    </DialogContent>
  )
}