import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContributionTable } from '@/components/contributions/contribution-table'
import { ContributionForm } from '@/components/contributions/contribution-form'
import { ContributionEmpty } from '@/components/contributions/contribution-empty'
import { useContributions, useDeleteContribution } from '@/hooks/use-contributions'
import { useContributors } from '@/hooks/use-contributors'
import { useHouses } from '@/hooks/use-houses'
import { getMonthLabel } from '@/lib/constants'
import type { ContributionDetail } from '@/types/contribution'

export function ContributionsPage() {
  const [filterContributorId, setFilterContributorId] = useState('')
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()))
  const [filterMonth, setFilterMonth] = useState('')
  const [filterHouseId, setFilterHouseId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContributionDetail | undefined>()
  const { t } = useTranslation('contributions')

  const contributorId = filterContributorId ? parseInt(filterContributorId, 10) : undefined
  const year = filterYear ? parseInt(filterYear, 10) : undefined
  const month = filterMonth ? parseInt(filterMonth, 10) : undefined
  const houseId = filterHouseId ? parseInt(filterHouseId, 10) : undefined

  const { data: contributions, isLoading, isError } = useContributions(contributorId, year, houseId)

  const filteredContributions = month
    ? contributions?.filter((c) => c.Month === month)
    : contributions
  const { data: contributors } = useContributors()
  const { data: houses } = useHouses()
  const deleteContribution = useDeleteContribution()

  function handleDelete(id: number) {
    deleteContribution.mutate(id, {
      onSuccess: () => toast.success(t('toast.deleted')),
      onError: () => toast.error(t('toast.errorDelete')),
    })
  }

  function handleEdit(contribution: ContributionDetail) {
    setEditing(contribution)
    setDialogOpen(true)
  }

  function handleDialogOpen(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setEditing(undefined)
    }
  }

  function handleViewReceipt() {
    if (!filterContributorId || !filterYear) {
      toast.error(t('filter.selectContributorAndYear'))
      return
    }
    const params = new URLSearchParams({ contributor_id: filterContributorId, year: filterYear })
    window.open(`/contributions/receipt?${params}`, '_blank')
  }

  // Unique contributors visible in current house-filtered results
  const houseContributors = filterHouseId
    ? Array.from(
        new Map(
          (filteredContributions ?? []).map((c) => [
            c.ContributorID,
            { id: c.ContributorID, name: c.ContributorName, houseNumber: c.HouseNumber },
          ])
        ).values()
      ).sort((a, b) => a.houseNumber.localeCompare(b.houseNumber))
    : []

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <p className="py-12 text-center text-destructive">{t('toast.errorLoad')}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={handleViewReceipt}>
            {t('viewReceipt')}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpen}>
            <DialogTrigger render={<Button />}>{t('newContribution')}</DialogTrigger>
            <ContributionForm
              contribution={editing}
              onSuccess={() => {
                setDialogOpen(false)
                setEditing(undefined)
                toast.success(editing ? t('toast.updated') : t('toast.created'))
              }}
            />
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="filterHouse" className="text-sm">{t('filter.house')}</Label>
          <Select value={filterHouseId || '__all__'} onValueChange={(v) => { setFilterHouseId(v === '__all__' ? '' : (v ?? '')); setFilterContributorId('') }}>
            <SelectTrigger id="filterHouse" className="w-48">
              <SelectValue placeholder={t('filter.allHouses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t('filter.allHouses')}</SelectItem>
              {(houses ?? []).map((h) => (
                <SelectItem key={h.ID} value={String(h.ID)} label={h.Name}>
                  {h.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filterContributor" className="text-sm">{t('filter.contributor')}</Label>
          <Select value={filterContributorId} onValueChange={(v) => { if (v) { setFilterContributorId(v); setFilterHouseId('') } }}>
            <SelectTrigger id="filterContributor" className="w-56">
              <SelectValue placeholder={t('filter.allContributors')}>
                {(value: string) => {
                  const c = contributors?.find((ct) => String(ct.ID) === value)
                  return c ? `${c.HouseNumber} — ${c.Name}` : value
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(contributors ?? []).map((c) => (
                <SelectItem key={c.ID} value={String(c.ID)} label={`${c.HouseNumber} — ${c.Name}`}>
                  {c.HouseNumber} — {c.Name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filterYear" className="text-sm">{t('filter.year')}</Label>
          <Input
            id="filterYear"
            type="number"
            placeholder={String(new Date().getFullYear())}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-28"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="filterMonth" className="text-sm">{t('filter.month')}</Label>
          <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v ?? '')}>
            <SelectTrigger id="filterMonth" className="w-36">
              <SelectValue placeholder={t('filter.allMonths')}>
                {(value: string) => (value ? getMonthLabel(t, parseInt(value, 10)) : t('filter.allMonths'))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)} label={getMonthLabel(t, m)}>
                  {getMonthLabel(t, m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(filterContributorId || filterYear || filterMonth || filterHouseId) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterContributorId('')
              setFilterYear('')
              setFilterMonth('')
              setFilterHouseId('')
            }}
          >
            {t('common:buttons.clear')}
          </Button>
        )}
      </div>

      {/* Per-contributor receipt buttons when house filter is active */}
      {filterHouseId && houseContributors.length > 0 && filterYear && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">{t('viewReceipt')}:</span>
          {houseContributors.map((c) => (
            <Button
              key={c.id}
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams({ contributor_id: String(c.id), year: filterYear })
                window.open(`/contributions/receipt?${params}`, '_blank')
              }}
            >
              {c.houseNumber} — {c.name}
            </Button>
          ))}
        </div>
      )}

      {!filteredContributions || filteredContributions.length === 0 ? (
        <ContributionEmpty onAdd={() => setDialogOpen(true)} />
      ) : (
        <ContributionTable
          contributions={filteredContributions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
