import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Expense } from '@/types/expense'

type ExpenseTableProps = {
  expenses: Expense[]
  onDelete: (id: number) => void
}

function formatCurrency(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

function formatDate(dateStr: string, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Date(dateStr).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  const { t, i18n } = useTranslation('expenses')

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col divide-y md:hidden">
        {expenses.map((expense) => (
          <div key={expense.ID} className="flex items-start justify-between py-3 gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">{expense.Description}</span>
              <span className="text-sm text-muted-foreground">{expense.CategoryName}</span>
              <span className="text-sm text-muted-foreground">{formatDate(expense.Date, i18n.language)}</span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-medium">{formatCurrency(expense.Amount, i18n.language)}</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-7 px-2"
                onClick={() => onDelete(expense.ID)}
              >
                {t('common:buttons.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.date')}</TableHead>
              <TableHead>{t('table.description')}</TableHead>
              <TableHead>{t('table.category')}</TableHead>
              <TableHead className="text-right">{t('table.amount')}</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.ID}>
                <TableCell>{formatDate(expense.Date, i18n.language)}</TableCell>
                <TableCell>{expense.Description}</TableCell>
                <TableCell>{expense.CategoryName}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(expense.Amount, i18n.language)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(expense.ID)}
                  >
                    {t('common:buttons.delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}