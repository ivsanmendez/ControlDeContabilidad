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
import { PaymentMethodBadge } from '@/components/contributions/payment-method-badge'
import { getMonthLabel } from '@/lib/constants'
import { useSortable, type SortState } from '@/hooks/use-sortable'
import type { ContributionDetail } from '@/types/contribution'

type ContributionTableProps = {
  contributions: ContributionDetail[]
  onEdit: (contribution: ContributionDetail) => void
  onDelete: (id: number) => void
}

type SortKey = 'house' | 'contributor' | 'phone' | 'category' | 'monthYear' | 'amount' | 'method' | 'paymentDate'

function formatCurrency(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

function formatDate(dateStr: string, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  // Parse date-only portion (YYYY-MM-DD) as a local calendar date to avoid
  // the UTC→local timezone shift that displays the previous day in UTC-6.
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
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

export function ContributionTable({ contributions, onEdit, onDelete }: ContributionTableProps) {
  const { t, i18n } = useTranslation('contributions')

  const comparators = useMemo(() => ({
    house: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.HouseNumber, b.HouseNumber),
    contributor: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.ContributorName, b.ContributorName),
    phone: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.Phone, b.Phone),
    category: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.CategoryName, b.CategoryName),
    monthYear: (a: ContributionDetail, b: ContributionDetail) => {
      const yearDiff = cmpNum(a.Year, b.Year)
      return yearDiff !== 0 ? yearDiff : cmpNum(a.Month, b.Month)
    },
    amount: (a: ContributionDetail, b: ContributionDetail) => cmpNum(a.Amount, b.Amount),
    method: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.PaymentMethod, b.PaymentMethod),
    paymentDate: (a: ContributionDetail, b: ContributionDetail) => cmpStr(a.PaymentDate, b.PaymentDate),
  }), [])

  const { sorted, sort, toggleSort } = useSortable(contributions, comparators)

  const headClass = 'cursor-pointer select-none'

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col divide-y md:hidden">
        {(sorted ?? []).map((c) => (
          <div key={c.ID} className="py-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{c.HouseNumber} — {c.ContributorName}</div>
                <div className="text-sm text-muted-foreground">{c.CategoryName}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-medium">{formatCurrency(c.Amount, i18n.language)}</div>
                <div className="text-sm text-muted-foreground">{getMonthLabel(t, c.Month)} {c.Year}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PaymentMethodBadge method={c.PaymentMethod} />
                <span className="text-sm text-muted-foreground">{formatDate(c.PaymentDate, i18n.language)}</span>
              </div>
              <div className="flex gap-1">
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
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={headClass} onClick={() => toggleSort('house')}>
                {t('table.house')} <SortIcon columnKey="house" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('contributor')}>
                {t('table.contributor')} <SortIcon columnKey="contributor" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('phone')}>
                {t('table.phone')} <SortIcon columnKey="phone" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('category')}>
                {t('table.category')} <SortIcon columnKey="category" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('monthYear')}>
                {t('table.monthYear')} <SortIcon columnKey="monthYear" sort={sort} />
              </TableHead>
              <TableHead className={`text-right ${headClass}`} onClick={() => toggleSort('amount')}>
                {t('table.amount')} <SortIcon columnKey="amount" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('method')}>
                {t('table.method')} <SortIcon columnKey="method" sort={sort} />
              </TableHead>
              <TableHead className={headClass} onClick={() => toggleSort('paymentDate')}>
                {t('table.paymentDate')} <SortIcon columnKey="paymentDate" sort={sort} />
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sorted ?? []).map((c) => (
              <TableRow key={c.ID}>
                <TableCell className="font-medium">{c.HouseNumber}</TableCell>
                <TableCell>{c.ContributorName}</TableCell>
                <TableCell>{c.Phone || '—'}</TableCell>
                <TableCell>{c.CategoryName}</TableCell>
                <TableCell>{getMonthLabel(t, c.Month)} {c.Year}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(c.Amount, i18n.language)}</TableCell>
                <TableCell>
                  <PaymentMethodBadge method={c.PaymentMethod} />
                </TableCell>
                <TableCell>{formatDate(c.PaymentDate, i18n.language)}</TableCell>
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