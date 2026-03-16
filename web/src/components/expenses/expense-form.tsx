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
import { useCreateExpense } from '@/hooks/use-expenses'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import { ApiClientError } from '@/lib/api-client'

type ExpenseFormProps = {
  onSuccess: () => void
}

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const createExpense = useCreateExpense()
  const { data: categories } = useExpenseCategories()
  const { t } = useTranslation('expenses')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')

  const activeCategories = categories?.filter((c) => c.IsActive) ?? []

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    try {
      await createExpense.mutateAsync({
        description,
        amount: parseFloat(amount),
        category_id: parseInt(categoryId, 10),
        date: new Date(date).toISOString(),
      })
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(t('form.errorCreate'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('form.title')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">{t('form.description')}</Label>
          <Input
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">{t('form.amount')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">{t('form.category')}</Label>
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')} required>
            <SelectTrigger id="category">
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
          <Label htmlFor="date">{t('form.date')}</Label>
          <Input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={createExpense.isPending}>
          {createExpense.isPending ? t('form.submitting') : t('form.submit')}
        </Button>
      </form>
    </DialogContent>
  )
}
