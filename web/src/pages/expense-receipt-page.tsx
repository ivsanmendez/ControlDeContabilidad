import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useExpense } from '@/hooks/use-expenses'
import { ExpenseReceiptSignDialog } from '@/components/expenses/expense-receipt-sign-dialog'
import type { ExpenseReceiptSignatureResponse } from '@/types/expense'

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
    month: 'long',
    day: 'numeric',
  })
}

export function ExpenseReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const expenseId = parseInt(id ?? '0', 10)
  const { t, i18n } = useTranslation('expenses')

  const { data: expense, isLoading, isError } = useExpense(expenseId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [signerName, setSignerName] = useState<string | null>(null)
  const [receiptSig, setReceiptSig] = useState<ExpenseReceiptSignatureResponse | null>(null)
  const [pendingPrint, setPendingPrint] = useState(false)

  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US'

  useEffect(() => {
    if (pendingPrint && receiptSig && !dialogOpen) {
      const timeout = setTimeout(() => {
        setPendingPrint(false)
        window.print()
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [pendingPrint, receiptSig, dialogOpen])

  if (!expenseId) {
    return <p className="p-8 text-center text-muted-foreground">{t('receipt.errorLoad')}</p>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !expense) {
    return <p className="p-8 text-center text-destructive">{t('receipt.errorLoad')}</p>
  }

  function handleSignSuccess(name: string, data: ExpenseReceiptSignatureResponse) {
    setSignerName(name)
    setReceiptSig(data)
    setDialogOpen(false)
    setPendingPrint(true)
  }

  return (
    <div className="receipt-page mx-auto max-w-3xl p-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{t('receipt.title')}</h1>
        {receiptSig && (
          <p className="mt-2 font-mono text-sm">
            {t('receipt.folio')}: <span className="font-semibold">{receiptSig.folio}</span>
          </p>
        )}
      </div>

      {/* Expense detail card */}
      <div className="mx-auto max-w-md rounded-lg border p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
          <dt className="text-sm font-medium text-muted-foreground">{t('table.description')}</dt>
          <dd className="text-sm">{expense.Description}</dd>

          <dt className="text-sm font-medium text-muted-foreground">{t('table.category')}</dt>
          <dd className="text-sm">{expense.CategoryName}</dd>

          <dt className="text-sm font-medium text-muted-foreground">{t('table.date')}</dt>
          <dd className="text-sm">{formatDate(expense.Date, i18n.language)}</dd>

          <dt className="text-sm font-medium text-muted-foreground">{t('table.amount')}</dt>
          <dd className="text-lg font-semibold">{formatCurrency(expense.Amount, i18n.language)}</dd>
        </dl>
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {t('receipt.printed')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button className="print:hidden" onClick={() => setDialogOpen(true)}>
            {t('receipt.signAndPrint')}
          </Button>
          <ExpenseReceiptSignDialog
            expenseId={expenseId}
            onSuccess={handleSignSuccess}
          />
        </Dialog>
      </div>

      {/* Signature, Seal & QR Area */}
      <div className="receipt-signature-area mt-10 grid grid-cols-3 gap-6 items-end">
        {/* Authorized Signature */}
        <div className="flex flex-col items-center gap-1">
          <div className="h-16" />
          <div className="w-full border-t border-foreground" />
          <span className="text-xs text-muted-foreground">{t('receipt.authorizedSignature')}</span>
          <span className="mt-1 text-xs text-muted-foreground">
            {t('receipt.name')}: {signerName ?? '____________________'}
          </span>
        </div>

        {/* Seal */}
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground">
            <span className="text-xs text-muted-foreground">{t('receipt.seal')}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-1">
          {receiptSig ? (
            <>
              <QRCodeSVG
                value={receiptSig.folio}
                size={96}
                level="M"
              />
              <span className="text-[10px] font-mono">{receiptSig.folio}</span>
            </>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-dashed border-muted-foreground">
              <span className="text-[10px] text-muted-foreground">QR</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">{t('receipt.digitalVerification')}</span>
        </div>
      </div>
    </div>
  )
}
