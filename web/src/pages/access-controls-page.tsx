import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useAllAccessControls,
  useCreateAccessControl,
  useUpdateAccessControl,
  useChangeAccessControlStatus,
  useMarkAccessControlSynced,
  useDeleteAccessControl,
  useEvaluateHouse,
} from '@/hooks/use-access-controls'
import { useHouses } from '@/hooks/use-houses'
import { useAuth } from '@/hooks/use-auth'
import type { AccessControlWithHouse, AccessControlStatus } from '@/types/house'

export function AccessControlsPage() {
  const { t } = useTranslation('houses')
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AccessControlWithHouse | null>(null)

  const { data: controls, isLoading, isError } = useAllAccessControls()
  const deleteAC = useDeleteAccessControl()
  const markSynced = useMarkAccessControlSynced()
  const changeStatus = useChangeAccessControlStatus()
  const evaluateHouse = useEvaluateHouse()

  function handleEdit(ac: AccessControlWithHouse) {
    setEditTarget(ac)
    setFormOpen(true)
  }

  function handleDialogChange(open: boolean) {
    setFormOpen(open)
    if (!open) setEditTarget(null)
  }

  function handleDelete(ac: AccessControlWithHouse) {
    deleteAC.mutate(ac.ID, {
      onSuccess: () => toast.success(t('accessControls.toast.deleted')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorDelete')),
    })
  }

  function handleMarkSynced(ac: AccessControlWithHouse) {
    markSynced.mutate(ac.ID, {
      onSuccess: () => toast.success(t('accessControls.toast.synced')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorSync')),
    })
  }

  function handleStatusChange(ac: AccessControlWithHouse, status: AccessControlStatus) {
    changeStatus.mutate({ id: ac.ID, status }, {
      onSuccess: () => toast.success(t('accessControls.toast.statusChanged')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorStatus')),
    })
  }

  function handleEvaluateHouse(houseID: number) {
    evaluateHouse.mutate(houseID, {
      onSuccess: () => toast.success(t('accessControls.toast.evaluated')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorEvaluate')),
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError) {
    return <p className="py-12 text-center text-destructive">{t('accessControls.toast.errorLoad')}</p>
  }

  const items = controls ?? []

  return (
    <Dialog open={formOpen} onOpenChange={handleDialogChange}>
      {formOpen && (
        <AccessControlFormDialog
          editTarget={editTarget}
          onSuccess={() => {
            setFormOpen(false)
            setEditTarget(null)
            toast.success(editTarget ? t('accessControls.toast.updated') : t('accessControls.toast.created'))
          }}
        />
      )}
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('accessControls.pageTitle')}</h1>
        {isAdmin && (
          <DialogTrigger render={<Button />}>
            {t('accessControls.newAccessControl')}
          </DialogTrigger>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-4">
          <p>{t('accessControls.empty')}</p>
          {isAdmin && (
            <DialogTrigger render={<Button variant="outline" />}>
              {t('accessControls.newAccessControl')}
            </DialogTrigger>
          )}
        </div>
      ) : (
        <div className="flex flex-col divide-y rounded-md border">
          {items.map((ac) => (
            <div key={ac.ID} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{ac.Code}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('accessControls.adminNumber')}: {ac.AdminNumber}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('accessControls.house')}: {ac.HouseName}
                  </span>
                  {!ac.PhysicalSyncedAt && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {t('accessControls.pendingSync')}
                    </span>
                  )}
                </div>
                {ac.Notes && (
                  <span className="text-xs text-muted-foreground truncate">{ac.Notes}</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <Select
                    value={ac.Status}
                    onValueChange={(v) => handleStatusChange(ac, v as AccessControlStatus)}
                  >
                    <SelectTrigger className={`h-7 w-28 text-xs border-0 ${
                      ac.Status === 'active' ? 'bg-green-50 text-green-700' :
                      ac.Status === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('accessControls.statusLabels.active')}</SelectItem>
                      <SelectItem value="warning">{t('accessControls.statusLabels.warning')}</SelectItem>
                      <SelectItem value="inactive">{t('accessControls.statusLabels.inactive')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {!isAdmin && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ac.Status === 'active' ? 'bg-green-100 text-green-700' :
                    ac.Status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t(`accessControls.statusLabels.${ac.Status}`)}
                  </span>
                )}

                {isAdmin && !ac.PhysicalSyncedAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title={t('accessControls.markSynced')}
                    onClick={() => handleMarkSynced(ac)}
                    disabled={markSynced.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    title={t('accessControls.toast.evaluated')}
                    onClick={() => handleEvaluateHouse(ac.HouseID)}
                    disabled={evaluateHouse.isPending}
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(ac)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(ac)}
                    disabled={deleteAC.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </Dialog>
  )
}

// AccessControlFormDialog — create (with house selector) or edit
type AccessControlFormDialogProps = {
  editTarget: AccessControlWithHouse | null
  onSuccess: () => void
}

function AccessControlFormDialog({ editTarget, onSuccess }: AccessControlFormDialogProps) {
  const { t } = useTranslation('houses')
  const { data: houses } = useHouses()
  const [houseID, setHouseID] = useState(editTarget ? String(editTarget.HouseID) : '')
  const [code, setCode] = useState(editTarget?.Code ?? '')
  const [adminNumber, setAdminNumber] = useState(editTarget?.AdminNumber ?? '')
  const [notes, setNotes] = useState(editTarget?.Notes ?? '')
  const [error, setError] = useState('')

  const createAC = useCreateAccessControl(parseInt(houseID || '0', 10))
  const updateAC = useUpdateAccessControl()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editTarget) {
        await updateAC.mutateAsync({ id: editTarget.ID, data: { code, admin_number: adminNumber, notes } })
      } else {
        await createAC.mutateAsync({ code, admin_number: adminNumber, notes })
      }
      onSuccess()
    } catch (err: unknown) {
      setError((err as Error).message || t(editTarget ? 'accessControls.toast.errorUpdate' : 'accessControls.toast.errorCreate'))
    }
  }

  const isPending = createAC.isPending || updateAC.isPending

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {editTarget ? t('accessControls.form.editTitle') : t('accessControls.form.title')}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {!editTarget && (
          <div className="flex flex-col gap-2">
            <Label>{t('accessControls.house')}</Label>
            <Select value={houseID} onValueChange={(v) => setHouseID(v ?? '')} required>
              <SelectTrigger>
                <SelectValue placeholder={t('assign.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(houses ?? []).map((h) => (
                  <SelectItem key={h.ID} value={String(h.ID)}>
                    {h.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {editTarget && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">
              {t('accessControls.house')}: <span className="font-medium text-foreground">{editTarget.HouseName}</span>
            </span>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="ac-code">{t('accessControls.code')}</Label>
          <Input
            id="ac-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('accessControls.form.codePlaceholder')}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ac-admin">{t('accessControls.adminNumber')}</Label>
          <Input
            id="ac-admin"
            value={adminNumber}
            onChange={(e) => setAdminNumber(e.target.value)}
            placeholder={t('accessControls.form.adminNumberPlaceholder')}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ac-notes">{t('accessControls.notes')}</Label>
          <Input
            id="ac-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('accessControls.form.notesPlaceholder')}
          />
        </div>
        <Button type="submit" disabled={isPending || (!editTarget && !houseID)}>
          {isPending
            ? t('accessControls.form.submitting')
            : editTarget
              ? t('accessControls.form.submitUpdate')
              : t('accessControls.form.submit')}
        </Button>
      </form>
    </DialogContent>
  )
}