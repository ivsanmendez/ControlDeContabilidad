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
import type { ExpenseCategory } from '@/types/expense-category'

type ExpenseCategoryTableProps = {
  categories: ExpenseCategory[]
  onEdit: (category: ExpenseCategory) => void
  onDelete: (id: number) => void
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('expense-categories')
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      }`}
    >
      {isActive ? t('status.active') : t('status.inactive')}
    </span>
  )
}

export function ExpenseCategoryTable({ categories, onEdit, onDelete }: ExpenseCategoryTableProps) {
  const { t } = useTranslation('expense-categories')

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col divide-y md:hidden">
        {categories.map((c) => (
          <div key={c.ID} className="flex items-start justify-between py-3 gap-3">
            <div className="min-w-0 flex flex-col gap-0.5">
              <div className="font-medium">{c.Name}</div>
              {c.Description && <div className="text-sm text-muted-foreground">{c.Description}</div>}
              <StatusBadge isActive={c.IsActive} />
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                {t('common:buttons.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDelete(c.ID)}
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
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.description')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.ID}>
                <TableCell className="font-medium">{c.Name}</TableCell>
                <TableCell>{c.Description || '—'}</TableCell>
                <TableCell>
                  <StatusBadge isActive={c.IsActive} />
                </TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(c)}>
                    {t('common:buttons.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(c.ID)}
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