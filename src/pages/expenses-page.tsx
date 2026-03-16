import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { ExpenseTable } from '@/components/expenses/expense-table'
import { ExpenseForm } from '@/components/expenses/expense-form'
import { ExpenseEmpty } from '@/components/expenses/expense-empty'
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses'

export function ExpensesPage() {
  const { data: expenses, isLoading, isError } = useExpenses()
  const deleteExpense = useDeleteExpense()
  const [dialogOpen, setDialogOpen] = useState(false)
  const { t } = useTranslation('expenses')

  function handleDelete(id: number) {
    deleteExpense.mutate(id, {
      onSuccess: () => toast.success(t('toast.deleted')),
      onError: () => toast.error(t('toast.errorDelete')),
    })
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

      {!expenses || expenses.length === 0 ? (
        <ExpenseEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <ExpenseTable expenses={expenses} onDelete={handleDelete} />
      )}
    </div>
  )
}
