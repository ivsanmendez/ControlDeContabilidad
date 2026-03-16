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
import type { ContributionCategory } from '@/types/category'

type CategoryTableProps = {
  categories: ContributionCategory[]
  onEdit: (category: ContributionCategory) => void
  onDelete: (id: number) => void
}

export function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
  const { t } = useTranslation('categories')

  return (
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
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.IsActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {c.IsActive ? t('status.active') : t('status.inactive')}
              </span>
            </TableCell>
            <TableCell className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(c)}
              >
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
  )
}
