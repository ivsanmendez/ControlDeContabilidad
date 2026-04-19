import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseEditForm } from '@/components/expenses/expense-edit-form'
import { ExpenseEmpty } from '@/components/expenses/expense-empty'
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses'
import { useExpenseCategories } from '@/hooks/use-expense-categories'
import type { Expense, ExpenseFilters } from '@/types/expense'

const PAGE_SIZE = 20

export function ExpensesPage() {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const { t } = useTranslation('expenses')

  const filters: ExpenseFilters = {
    page,
    page_size: PAGE_SIZE,
    ...(search && { search }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
    ...(categoryId && { category_id: Number(categoryId) }),
  }

  const { data: result, isLoading, isError } = useExpenses(filters)
  const { data: categories } = useExpenseCategories()
  const deleteExpense = useDeleteExpense()

  const activeCategories = categories?.filter((c) => c.IsActive) ?? []

  const resetPage = useCallback(() => setPage(1), [])

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
  }

  function handleDelete(id: number) {
    deleteExpense.mutate(id, {
      onSuccess: () => toast.success(t('toast.deleted')),
      onError: () => toast.error(t('toast.errorDelete')),
    })
  }

  function clearFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setCategoryId('')
    setPage(1)
  }

  const hasFilters = search || dateFrom || dateTo || categoryId
  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 0
  const showFrom = result && result.total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0
  const showTo = result ? Math.min(page * PAGE_SIZE, result.total) : 0

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>{t('newExpense')}</DialogTrigger>
          <ExpenseForm
            onSuccess={() => {
              setDialogOpen(false)
              toast.success(t('toast.created'))
            }}
          />
        </Dialog>
      </div>

      {/* Edit dialog — controlled externally, no trigger button */}
      <Dialog open={editingExpense !== null} onOpenChange={(open) => { if (!open) setEditingExpense(null) }}>
        {editingExpense && (
          <ExpenseEditForm
            expense={editingExpense}
            onSuccess={() => {
              setEditingExpense(null)
              toast.success(t('toast.updated'))
            }}
          />
        )}
      </Dialog>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder={t('filter.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage() }}
          className="w-48"
        />
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); resetPage() }}
          className="w-36"
          aria-label={t('filter.dateFrom')}
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); resetPage() }}
          className="w-36"
          aria-label={t('filter.dateTo')}
        />
        <Select
          value={categoryId}
          onValueChange={(v) => { setCategoryId(v ?? ''); resetPage() }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder={t('filter.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            {activeCategories.map((c) => (
              <SelectItem key={c.ID} value={String(c.ID)}>
                {c.Name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            {t('filter.clear')}
          </Button>
        )}
      </div>

      {!result || result.items.length === 0 ? (
        <ExpenseEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <>
          <ExpenseTable expenses={result.items} onEdit={handleEdit} onDelete={handleDelete} />

          {/* Pagination */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {t('pagination.showing', { from: showFrom, to: showTo, total: result.total })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                {t('pagination.previous')}
              </Button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('pagination.next')}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
