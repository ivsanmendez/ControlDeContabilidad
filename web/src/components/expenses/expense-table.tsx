import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown, ArrowUpDown, FileText } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSortable, type SortState } from '@/hooks/use-sortable'
import type { Expense } from '@/types/expense'

type ExpenseTableProps = {
  expenses: Expense[]
  onDelete: (id: number) => void
}

type SortKey = 'date' | 'description' | 'category' | 'amount'

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

const cmpStr = (a: string, b: string) => a.localeCompare(b)
const cmpNum = (a: number, b: number) => a - b

function SortIcon({ columnKey, sort }: { columnKey: SortKey; sort: SortState<SortKey> | null }) {
  if (sort?.key !== columnKey) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />
  if (sort.direction === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />
  return <ArrowDown className="ml-1 inline h-3 w-3" />
}

export function ExpenseTable({ expenses, onDelete }: ExpenseTableProps) {
  const { t, i18n } = useTranslation('expenses')

  const comparators = useMemo<Record<SortKey, (a: Expense, b: Expense) => number>>(
    () => ({
      date: (a, b) => cmpStr(a.Date, b.Date),
      description: (a, b) => cmpStr(a.Description, b.Description),
      category: (a, b) => cmpStr(a.CategoryName, b.CategoryName),
      amount: (a, b) => cmpNum(a.Amount, b.Amount),
    }),
    [],
  )

  const { sorted, sort, toggleSort } = useSortable<Expense, SortKey>(expenses, comparators)
  const items = sorted ?? expenses

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col divide-y md:hidden">
        {items.map((expense) => (
          <div key={expense.ID} className="flex items-start justify-between py-3 gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">{expense.Description}</span>
              <span className="text-sm text-muted-foreground">{expense.CategoryName}</span>
              <span className="text-sm text-muted-foreground">{formatDate(expense.Date, i18n.language)}</span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="font-medium">{formatCurrency(expense.Amount, i18n.language)}</span>
              <div className="flex gap-1">
                <Link
                  to={`/expenses/${expense.ID}/receipt`}
                  title={t('receipt.viewReceipt')}
                  className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' h-7 px-2'}
                >
                  <FileText className="h-4 w-4" />
                </Link>
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
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
                {t('table.date')}
                <SortIcon columnKey="date" sort={sort} />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('description')}>
                {t('table.description')}
                <SortIcon columnKey="description" sort={sort} />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('category')}>
                {t('table.category')}
                <SortIcon columnKey="category" sort={sort} />
              </TableHead>
              <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort('amount')}>
                {t('table.amount')}
                <SortIcon columnKey="amount" sort={sort} />
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((expense) => (
              <TableRow key={expense.ID}>
                <TableCell>{formatDate(expense.Date, i18n.language)}</TableCell>
                <TableCell>{expense.Description}</TableCell>
                <TableCell>{expense.CategoryName}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(expense.Amount, i18n.language)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Link
                      to={`/expenses/${expense.ID}/receipt`}
                      title={t('receipt.viewReceipt')}
                      className={buttonVariants({ variant: 'ghost', size: 'sm' })}
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(expense.ID)}
                    >
                      {t('common:buttons.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
