import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useContributions } from '@/hooks/use-contributions'
import { useContributor } from '@/hooks/use-contributors'
import type { ReceiptSignatureResponse } from '@/hooks/use-receipt-signature'
import { ReceiptSignDialog } from '@/components/contributions/receipt-sign-dialog'
import { getMonthLabel } from '@/lib/constants'

function formatCurrency(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

export function ContributionReceiptPage() {
  const [params] = useSearchParams()
  const contributorId = parseInt(params.get('contributor_id') ?? '0', 10)
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()), 10)
  const { t, i18n } = useTranslation('contributions')

  const { data: contributor, isLoading: loadingContributor } = useContributor(contributorId)
  const { data: contributions, isLoading: loadingContributions, isError } = useContributions(contributorId, year)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [signerName, setSignerName] = useState<string | null>(null)
  const [receiptSig, setReceiptSig] = useState<ReceiptSignatureResponse | null>(null)
  const [pendingPrint, setPendingPrint] = useState(false)

  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US'

  // Print after React renders the QR + signer name and dialog is fully closed
  useEffect(() => {
    if (pendingPrint && receiptSig && !dialogOpen) {
      const timeout = setTimeout(() => {
        setPendingPrint(false)
        window.print()
      }, 400)
      return () => clearTimeout(timeout)
    }
  }, [pendingPrint, receiptSig, dialogOpen])

  if (!contributorId) {
    return <p className="p-8 text-center text-muted-foreground">{t('receipt.missingContributor')}</p>
  }

  if (loadingContributor || loadingContributions) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <p className="p-8 text-center text-destructive">{t('receipt.errorLoad')}</p>
  }

  const house = contributor?.HouseNumber ?? '—'
  const contributorName = contributor?.Name ?? '—'
  const contributorPhone = contributor?.Phone ?? ''

  const paidByMonth = new Map<number, typeof contributions>()
  for (const c of contributions ?? []) {
    const list = paidByMonth.get(c.Month) ?? []
    list.push(c)
    paidByMonth.set(c.Month, list)
  }

  const totalPaid = (contributions ?? []).reduce((sum, c) => sum + c.Amount, 0)

  function handleSignSuccess(name: string, data: ReceiptSignatureResponse) {
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
        <p className="mt-1 text-lg text-muted-foreground">
          {t('receipt.house')}: <span className="font-semibold text-foreground">{house}</span> — {t('receipt.year')}: <span className="font-semibold text-foreground">{year}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {contributorName}{contributorPhone ? ` — ${contributorPhone}` : ''}
        </p>
        {receiptSig && (
          <p className="mt-2 font-mono text-sm">
            {t('receipt.folio')}: <span className="font-semibold">{receiptSig.folio}</span>
          </p>
        )}
      </div>

      {/* 12-month grid: 2 rows x 6 cols */}
      <div className="grid grid-cols-6 gap-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
          const entries = paidByMonth.get(monthNum)

          return (
            <div
              key={monthNum}
              className={`flex flex-col items-center rounded-lg border p-3 ${
                entries
                  ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                  : 'border-dashed'
              }`}
            >
              <span className="text-xs font-medium text-muted-foreground">{getMonthLabel(t, monthNum)}</span>
              {entries ? (
                <>
                  <span className="mt-1 text-lg text-green-600 dark:text-green-400">&#10003;</span>
                  {entries.map((e) => (
                    <div key={e.ID} className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground">{e.CategoryName}</span>
                      <span className="text-sm font-medium">{formatCurrency(e.Amount, i18n.language)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <span className="mt-1 text-lg text-muted-foreground">—</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t('receipt.totalPaid')}: <span className="font-semibold text-foreground">{formatCurrency(totalPaid, i18n.language)}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {t('receipt.printed')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button className="print:hidden" onClick={() => setDialogOpen(true)}>
            {t('common:buttons.print')}
          </Button>
          <ReceiptSignDialog
            contributorId={contributorId}
            year={year}
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
