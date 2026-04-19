import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, UserPlus, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { HouseAssignDialog } from '@/components/houses/house-assign-dialog'
import { useHouse, useUnassignContributor } from '@/hooks/use-houses'

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('houses')
  const [assignOpen, setAssignOpen] = useState(false)

  const houseID = parseInt(id ?? '0', 10)
  const { data: detail, isLoading, isError } = useHouse(houseID)
  const unassign = useUnassignContributor()

  function handleUnassign(contributorID: number) {
    unassign.mutate({ houseID, contributorID }, {
      onSuccess: () => toast.success(t('assign.unassigned')),
      onError: (err) => toast.error(err.message || t('assign.errorUnassign')),
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !detail) {
    return <p className="py-12 text-center text-destructive">{t('toast.errorLoad')}</p>
  }

  const contributors = detail.Contributors ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/houses')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t('detail.back')}
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{detail.Name}</h1>
          {detail.Address && (
            <p className="text-muted-foreground mt-1">{detail.Address}</p>
          )}
          {detail.Notes && (
            <p className="text-sm text-muted-foreground mt-1">{detail.Notes}</p>
          )}
        </div>
      </div>

      {/* Contributors section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('detail.contributors')}</h2>
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              <UserPlus className="h-4 w-4 mr-1" />
              {t('assign.button')}
            </DialogTrigger>
            {assignOpen && (
              <HouseAssignDialog
                houseID={houseID}
                assigned={detail.Contributors}
                onSuccess={() => {
                  setAssignOpen(false)
                  toast.success(t('assign.assigned'))
                }}
              />
            )}
          </Dialog>
        </div>

        {contributors.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">{t('detail.noContributors')}</p>
        ) : (
          <div className="flex flex-col divide-y rounded-md border">
            {contributors.map((c) => (
              <div key={c.ID} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{c.Name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t('detail.houseNumber')}: {c.HouseNumber}
                    {c.Phone ? ` · ${c.Phone}` : ''}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleUnassign(c.ID)}
                  disabled={unassign.isPending}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}