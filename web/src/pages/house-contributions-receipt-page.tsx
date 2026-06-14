import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useContributions } from '@/hooks/use-contributions'
import { useHouse } from '@/hooks/use-houses'
import { getMonthLabel } from '@/lib/constants'
import type { ContributionDetail } from '@/types/contribution'

function formatCurrency(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

type ContributorSection = {
  id: number
  name: string
  houseNumber: string
  phone: string
  contributions: ContributionDetail[]
  totalPaid: number
  byMonth: Map<number, ContributionDetail[]>
}

export function HouseContributionsReceiptPage() {
  const [params] = useSearchParams()
  const houseID = parseInt(params.get('house_id') ?? '0', 10)
  const year = parseInt(params.get('year') ?? String(new Date().getFullYear()), 10)
  const { t, i18n } = useTranslation('contributions')

  const { data: house, isLoading: loadingHouse } = useHouse(houseID)
  const { data: contributions, isLoading: loadingContribs, isError } = useContributions(undefined, year, houseID)

  const locale = i18n.language.startsWith('es') ? 'es-MX' : 'en-US'

  if (loadingHouse || loadingContribs) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <p className="p-8 text-center text-destructive">{t('receipt.errorLoad')}</p>
  }

  // Group contributions by contributor
  const contributorMap = new Map<number, ContributorSection>()
  for (const c of contributions ?? []) {
    if (!contributorMap.has(c.ContributorID)) {
      contributorMap.set(c.ContributorID, {
        id: c.ContributorID,
        name: c.ContributorName,
        houseNumber: c.HouseNumber,
        phone: c.Phone,
        contributions: [],
        totalPaid: 0,
        byMonth: new Map(),
      })
    }
    const section = contributorMap.get(c.ContributorID)!
    section.contributions.push(c)
    section.totalPaid += c.Amount
    const monthList = section.byMonth.get(c.Month) ?? []
    monthList.push(c)
    section.byMonth.set(c.Month, monthList)
  }

  const sections = Array.from(contributorMap.values()).sort((a, b) =>
    a.houseNumber.localeCompare(b.houseNumber)
  )

  const grandTotal = sections.reduce((sum, s) => sum + s.totalPaid, 0)
  const houseName = house?.Name ?? `Casa ${houseID}`

  return (
    <div className="receipt-page mx-auto max-w-3xl p-8">
      {/* Document header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{t('receipt.title')}</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {t('receipt.house')}: <span className="font-semibold text-foreground">{houseName}</span>
          {' — '}
          {t('receipt.year')}: <span className="font-semibold text-foreground">{year}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('receipt.printed')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {sections.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          {sections.map((section, idx) => (
            <div key={section.id} className={idx > 0 ? 'mt-8 pt-8 border-t' : ''}>
              {/* Contributor header */}
              <div className="mb-3">
                <p className="font-semibold">
                  {section.houseNumber} — {section.name}
                  {section.phone ? <span className="font-normal text-muted-foreground ml-2">{section.phone}</span> : null}
                </p>
              </div>

              {/* 12-month grid */}
              <div className="grid grid-cols-6 gap-3">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                  const entries = section.byMonth.get(monthNum)
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

              {/* Contributor subtotal */}
              <p className="mt-2 text-right text-sm text-muted-foreground">
                {t('receipt.totalPaid')}: <span className="font-semibold text-foreground">{formatCurrency(section.totalPaid, i18n.language)}</span>
              </p>
            </div>
          ))}

          {/* Grand total + signature area */}
          <div className="mt-8 flex items-center justify-between border-t pt-4">
            <div>
              <p className="font-semibold">
                {t('receipt.totalPaid')}: {formatCurrency(grandTotal, i18n.language)}
              </p>
              <p className="text-xs text-muted-foreground">{sections.length} contribuyentes</p>
            </div>
            <Button className="print:hidden" onClick={() => window.print()}>
              {t('common:buttons.print')}
            </Button>
          </div>

          {/* Signature area */}
          <div className="mt-10 grid grid-cols-3 gap-6 items-end">
            <div className="flex flex-col items-center gap-1">
              <div className="h-16" />
              <div className="w-full border-t border-foreground" />
              <span className="text-xs text-muted-foreground">{t('receipt.authorizedSignature')}</span>
              <span className="mt-1 text-xs text-muted-foreground">{t('receipt.name')}: ____________________</span>
            </div>
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground">
                <span className="text-xs text-muted-foreground">{t('receipt.seal')}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-24 items-center justify-center rounded border-2 border-dashed border-muted-foreground">
                <span className="text-[10px] text-muted-foreground">QR</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{t('receipt.digitalVerification')}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
