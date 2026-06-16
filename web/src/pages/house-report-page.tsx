import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useHouseReport } from '@/hooks/use-reports'
import { getMonthLabel } from '@/lib/constants'

type HangTagTarget = { code: string; adminNumber: string }

const INK_COLORS = {
  black: { label: 'Negro', hex: '#000000' },
  darkblue: { label: 'Azul Oscuro', hex: '#00008B' },
  darkgray: { label: 'Gris Oscuro', hex: '#A9A9A9' },
} as const

function PositionPickerDialog({
  target,
  houseID,
  onClose,
}: {
  target: HangTagTarget
  houseID: number
  onClose: () => void
}) {
  const { t } = useTranslation('reports')
  const [selectedColor, setSelectedColor] = useState<keyof typeof INK_COLORS>('black')

  function openPrint(pos: number) {
    const url = `/hangtag?code=${encodeURIComponent(target.code)}&admin=${encodeURIComponent(target.adminNumber)}&houseID=${houseID}&pos=${pos}&color=${selectedColor}`
    window.open(url, '_blank', 'width=820,height=1160')
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('house.pickPosition')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          {target.adminNumber} — <span className="font-mono">{target.code}</span>
        </p>

        <div className="mb-4 space-y-2">
          <Label className="text-sm">Selecciona color de tinta</Label>
          <div className="flex gap-2">
            {(Object.entries(INK_COLORS) as Array<[keyof typeof INK_COLORS, typeof INK_COLORS[keyof typeof INK_COLORS]]>).map(([key, { label, hex }]) => (
              <button
                key={key}
                onClick={() => setSelectedColor(key)}
                className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${
                  selectedColor === key
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
                }`}
              >
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: hex }} />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((pos) => (
            <button
              key={pos}
              onClick={() => openPrint(pos)}
              className="aspect-[7/9] border-2 border-border rounded-lg flex items-center justify-center text-3xl font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {pos}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function fmt(amount: number, lang: string) {
  const locale = lang.startsWith('es') ? 'es-MX' : 'en-US'
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MXN' }).format(amount)
}

export function HouseReportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation('reports')
  const houseID = parseInt(id ?? '0', 10)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [hangTagTarget, setHangTagTarget] = useState<HangTagTarget | null>(null)

  const { data: report, isLoading, isError } = useHouseReport(houseID, year)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !report) {
    return <p className="py-12 text-center text-destructive">{t('toast.errorLoad')}</p>
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Screen-only controls */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/houses/${houseID}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('house.back')}
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="report-year" className="text-sm">{t('house.year')}</Label>
            <Input
              id="report-year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
              className="w-24"
            />
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            {t('common:buttons.print')}
          </Button>
        </div>
      </div>

      {/* Report header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{report.house_name}</h1>
        {report.house_address && (
          <p className="text-muted-foreground mt-0.5">{report.house_address}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">{t('house.title')} — {report.year}</p>
      </div>

      {/* Users section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('house.users')}</h2>
        {(report.users ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('house.noUsers')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">{t('house.userEmail')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.userRole')}</th>
                </tr>
              </thead>
              <tbody>
                {report.users.map((u) => (
                  <tr key={u.email} className="border-b last:border-b-0">
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Access Controls section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('house.accessControls')}</h2>
        {(report.access_controls ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('house.noAccessControls')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">{t('house.acCode')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.acAdminNumber')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.acStatus')}</th>
                  <th className="px-3 py-2 text-left font-medium print:hidden">{t('house.acNotes')}</th>
                </tr>
              </thead>
              <tbody>
                {report.access_controls.map((ac, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-mono">{ac.code}</td>
                    <td className="px-3 py-2">{ac.admin_number}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ac.status === 'active' ? 'bg-green-100 text-green-700' :
                        ac.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {ac.status}
                      </span>
                      {!ac.physical_synced_at && (
                        <span className="ml-2 text-xs text-amber-600">{t('house.acPendingSync')}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground print:hidden">{ac.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Vehicles section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('house.vehicles')}</h2>
        {(report.vehicles ?? []).length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('house.noVehicles')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">{t('house.vPlate')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.vColor')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.vModel')}</th>
                  <th className="px-3 py-2 text-left font-medium">{t('house.vControls')}</th>
                  <th className="px-3 py-2 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {report.vehicles.map((v, i) => (
                  <tr key={i} className="border-b last:border-b-0">
                    <td className="px-3 py-2 font-medium">{v.plate}</td>
                    <td className="px-3 py-2">{v.color}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-3 py-2">
                      {(v.assigned_controls ?? []).length > 0
                        ? <span className="font-mono text-xs">{v.assigned_controls.join(', ')}</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-3 py-2 print:hidden">
                      {(v.assigned_controls ?? []).map((code) => {
                        const ac = report.access_controls.find((a) => a.code === code)
                        if (!ac) return null
                        return (
                          <Button
                            key={code}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 mr-1"
                            onClick={() => setHangTagTarget({ code: ac.code, adminNumber: ac.admin_number })}
                          >
                            {t('house.vHangTag')} {ac.code}
                          </Button>
                        )
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Contributors section */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('house.contributors')}</h2>

        {report.contributors.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('house.noContributors')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-2 text-left font-medium">No.</th>
                  <th className="px-3 py-2 text-left font-medium">Nombre</th>
                  <th className="px-3 py-2 text-left font-medium print:hidden">Teléfono</th>
                  <th className="px-3 py-2 text-left font-medium print:hidden">{t('house.cameraAccess')}</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i + 1} className="px-2 py-2 text-right font-medium text-xs">
                      {getMonthLabel(t, i + 1)}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium">{t('house.totalPaid')}</th>
                </tr>
              </thead>
              <tbody>
                {report.contributors.map((c) => {
                  const paymentMap = Object.fromEntries(
                    (c.payments ?? []).map((p) => [p.month, p.amount])
                  )
                  return (
                    <tr key={c.contributor_id} className="border-b last:border-b-0">
                      <td className="px-3 py-2 text-muted-foreground">{c.house_number}</td>
                      <td className="px-3 py-2 font-medium">{c.name}</td>
                      <td className="px-3 py-2 text-muted-foreground print:hidden">{c.phone || '—'}</td>
                      <td className="px-3 py-2 print:hidden">
                        {c.camera_access
                          ? <Video className="h-4 w-4 text-primary" />
                          : <span className="text-muted-foreground/40">—</span>}
                      </td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const amt = paymentMap[i + 1]
                        return (
                          <td key={i + 1} className={`px-2 py-2 text-right text-xs ${amt ? '' : 'text-muted-foreground/30'}`}>
                            {amt ? fmt(amt, i18n.language) : '—'}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-right font-semibold">
                        {fmt(c.total_paid, i18n.language)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Monthly income summary */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('house.monthlyIncome')}</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">{t('columns.month')}</th>
                <th className="px-3 py-2 text-right font-medium">{t('columns.income')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b bg-muted/30 font-bold">
                <td className="px-3 py-2">{t('house.total')}</td>
                <td className="px-3 py-2 text-right">{fmt(report.total_income, i18n.language)}</td>
              </tr>
              {report.months.map((m) => (
                <tr key={m.month} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{getMonthLabel(t, m.month)}</td>
                  <td className={`px-3 py-2 text-right ${m.income === 0 ? 'text-muted-foreground/40' : ''}`}>
                    {m.income > 0 ? fmt(m.income, i18n.language) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Position picker dialog */}
      {hangTagTarget && (
        <PositionPickerDialog
          target={hangTagTarget}
          houseID={houseID}
          onClose={() => setHangTagTarget(null)}
        />
      )}

      {/* Print footer — house name and year only, no QR */}
      <div className="hidden print:block print:mt-8 print:pt-4 print:border-t print:text-xs print:text-muted-foreground">
        {report.house_name} — {report.year}
      </div>
    </div>
  )
}