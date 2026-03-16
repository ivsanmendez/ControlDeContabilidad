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
  )
}
