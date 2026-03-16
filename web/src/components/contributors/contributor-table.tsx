import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSortable, type SortState } from '@/hooks/use-sortable'
import type { Contributor } from '@/types/contributor'

type ContributorTableProps = {
  contributors: Contributor[]
  onEdit: (contributor: Contributor) => void
  onDelete: (id: number) => void
}

type SortKey = 'house' | 'name' | 'phone'

const cmpStr = (a: string, b: string) => a.localeCompare(b)

function SortIcon({ columnKey, sort }: { columnKey: SortKey; sort: SortState<SortKey> | null }) {
  if (sort?.key !== columnKey) return <ArrowUpDown className="ml-1 inline h-3 w-3 text-muted-foreground/50" />
  if (sort.direction === 'asc') return <ArrowUp className="ml-1 inline h-3 w-3" />
  return <ArrowDown className="ml-1 inline h-3 w-3" />
}

export function ContributorTable({ contributors, onEdit, onDelete }: ContributorTableProps) {
  const { t } = useTranslation('contributors')

  const comparators = useMemo(() => ({
    house: (a: Contributor, b: Contributor) => cmpStr(a.HouseNumber, b.HouseNumber),
    name: (a: Contributor, b: Contributor) => cmpStr(a.Name, b.Name),
    phone: (a: Contributor, b: Contributor) => cmpStr(a.Phone, b.Phone),
  }), [])

  const { sorted, sort, toggleSort } = useSortable(contributors, comparators)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('house')}>
            {t('table.house')} <SortIcon columnKey="house" sort={sort} />
          </TableHead>
          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('name')}>
            {t('table.name')} <SortIcon columnKey="name" sort={sort} />
          </TableHead>
          <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('phone')}>
            {t('table.phone')} <SortIcon columnKey="phone" sort={sort} />
          </TableHead>
          <TableHead className="w-32" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {(sorted ?? []).map((c) => (
          <TableRow key={c.ID}>
            <TableCell className="font-medium">{c.HouseNumber}</TableCell>
            <TableCell>{c.Name}</TableCell>
            <TableCell>{c.Phone || '—'}</TableCell>
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
