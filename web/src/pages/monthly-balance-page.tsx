import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getMonthLabel } from '@/lib/constants'
import { useMonthlyBalance } from '@/hooks/use-reports'

function formatCurrency(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

function balanceClass(amount: number) {
  return amount < 0 ? 'text-destructive' : ''
}

export function MonthlyBalancePage() {
  const [year, setYear] = useState(() => new Date().getFullYear())
  const { t, i18n } = useTranslation('reports')

  const { data: report, isLoading, isError } = useMonthlyBalance(year)

  if (isError) {
    toast.error(t('toast.errorLoad'))
  }

  const hasData = report && report.months.some((m) => m.income > 0 || m.expenses > 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Print-only header */}
      <div className="hidden print:block print:text-center print:mb-4">
        <h1 className="text-xl font-bold">{t('printHeader')}</h1>
        <p className="text-sm text-muted-foreground">{year}</p>
      </div>

      {/* Screen controls */}
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button variant="outline" onClick={() => window.print()}>
          {t('common:buttons.print')}
        </Button>
      </div>

      <div className="flex items-end gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <Label htmlFor="reportYear" className="text-sm">{t('yearSelector')}</Label>
          <Input
            id="reportYear"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
            className="w-28"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && !hasData && (
        <p className="py-12 text-center text-muted-foreground">{t('empty')}</p>
      )}

      {!isLoading && hasData && report && (
        <>
          {/* Mobile cards */}
          <div className="flex flex-col divide-y md:hidden">
            {/* Totals card */}
            <div className="py-3 bg-muted/50 rounded px-2 font-bold mb-1">
              <div className="text-sm mb-1">{t('rows.totals')}</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-muted-foreground font-normal">{t('columns.income')}</div>
                  <div>{formatCurrency(report.total_income, i18n.language)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-normal">{t('columns.expenses')}</div>
                  <div>{formatCurrency(report.total_expenses, i18n.language)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-normal">{t('columns.balance')}</div>
                  <div className={balanceClass(report.total_balance)}>{formatCurrency(report.total_balance, i18n.language)}</div>
                </div>
              </div>
            </div>

            {/* Month cards */}
            {report.months.map((m) => (
              <div key={m.month} className="py-3">
                <div className="font-medium mb-1">{getMonthLabel(t, m.month)}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">{t('columns.income')}</div>
                    <div>{formatCurrency(m.income, i18n.language)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('columns.expenses')}</div>
                    <div>{formatCurrency(m.expenses, i18n.language)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('columns.balance')}</div>
                    <div className={balanceClass(m.balance)}>{formatCurrency(m.balance, i18n.language)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t('columns.cumulative')}</div>
                    <div className={balanceClass(m.cumulative_balance)}>{formatCurrency(m.cumulative_balance, i18n.language)}</div>
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
                  <TableHead>{t('columns.month')}</TableHead>
                  <TableHead className="text-right">{t('columns.income')}</TableHead>
                  <TableHead className="text-right">{t('columns.expenses')}</TableHead>
                  <TableHead className="text-right">{t('columns.balance')}</TableHead>
                  <TableHead className="text-right">{t('columns.cumulative')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>{t('rows.totals')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(report.total_income, i18n.language)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(report.total_expenses, i18n.language)}</TableCell>
                  <TableCell className={`text-right ${balanceClass(report.total_balance)}`}>
                    {formatCurrency(report.total_balance, i18n.language)}
                  </TableCell>
                  <TableCell />
                </TableRow>
                {report.months.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell>{getMonthLabel(t, m.month)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.income, i18n.language)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.expenses, i18n.language)}</TableCell>
                    <TableCell className={`text-right ${balanceClass(m.balance)}`}>
                      {formatCurrency(m.balance, i18n.language)}
                    </TableCell>
                    <TableCell className={`text-right ${balanceClass(m.cumulative_balance)}`}>
                      {formatCurrency(m.cumulative_balance, i18n.language)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
