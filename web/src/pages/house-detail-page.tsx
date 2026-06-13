import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, UserPlus, UserMinus, Plus, Pencil, Trash2, RefreshCw, Car, Video, VideoOff, ShieldCheck } from 'lucide-react'
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
import { HouseAssignDialog } from '@/components/houses/house-assign-dialog'
import { useHouse, useUnassignContributor } from '@/hooks/use-houses'
import {
  useAccessControls,
  useCreateAccessControl,
  useUpdateAccessControl,
  useChangeAccessControlStatus,
  useMarkAccessControlSynced,
  useDeleteAccessControl,
  useEvaluateHouse,
  useLookupAccessControlByCode,
} from '@/hooks/use-access-controls'
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useAssignAccessControl,
  useUnassignAccessControl,
} from '@/hooks/use-vehicles'
import type { AccessControl, AccessControlStatus, Vehicle } from '@/types/house'
import { useAuth } from '@/hooks/use-auth'
import { useHouseUsers } from '@/hooks/use-user-admin'

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('houses')
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [assignOpen, setAssignOpen] = useState(false)
  const [acFormOpen, setAcFormOpen] = useState(false)
  const [acEditTarget, setAcEditTarget] = useState<AccessControl | null>(null)
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false)
  const [vehicleEditTarget, setVehicleEditTarget] = useState<Vehicle | null>(null)
  const [vehicleAssignTarget, setVehicleAssignTarget] = useState<Vehicle | null>(null)

  const houseID = parseInt(id ?? '0', 10)
  const { data: detail, isLoading, isError } = useHouse(houseID)
  const { data: accessControls } = useAccessControls(houseID)
  const { data: vehicles } = useVehicles(houseID)
  const { data: houseUsers } = useHouseUsers(houseID)

  const unassign = useUnassignContributor()
  const deleteAC = useDeleteAccessControl()
  const markSynced = useMarkAccessControlSynced()
  const changeStatus = useChangeAccessControlStatus()
  const evaluateHouse = useEvaluateHouse()
  const deleteVehicle = useDeleteVehicle()
  const unassignAC = useUnassignAccessControl()

  function handleUnassign(contributorID: number) {
    unassign.mutate({ houseID, contributorID }, {
      onSuccess: () => toast.success(t('assign.unassigned')),
      onError: (err) => toast.error(err.message || t('assign.errorUnassign')),
    })
  }

  function handleDeleteAC(ac: AccessControl) {
    deleteAC.mutate(ac.ID, {
      onSuccess: () => toast.success(t('accessControls.toast.deleted')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorDelete')),
    })
  }

  function handleMarkSynced(ac: AccessControl) {
    markSynced.mutate(ac.ID, {
      onSuccess: () => toast.success(t('accessControls.toast.synced')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorSync')),
    })
  }

  function handleChangeStatus(ac: AccessControl, status: AccessControlStatus) {
    changeStatus.mutate({ id: ac.ID, status }, {
      onSuccess: () => toast.success(t('accessControls.toast.statusChanged')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorStatus')),
    })
  }

  function handleEvaluate() {
    evaluateHouse.mutate(houseID, {
      onSuccess: () => toast.success(t('accessControls.toast.evaluated')),
      onError: (err) => toast.error(err.message || t('accessControls.toast.errorEvaluate')),
    })
  }

  function handleDeleteVehicle(v: Vehicle) {
    deleteVehicle.mutate(v.ID, {
      onSuccess: () => toast.success(t('vehicles.toast.deleted')),
      onError: (err) => toast.error(err.message || t('vehicles.toast.errorDelete')),
    })
  }

  function handleUnassignAC(vehicleID: number, controlID: number) {
    unassignAC.mutate({ vehicleID, controlID }, {
      onSuccess: () => toast.success(t('vehicles.toast.unassigned')),
      onError: (err) => toast.error(err.message || t('vehicles.toast.errorUnassign')),
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
  const controls = accessControls ?? []
  const vehicleList = vehicles ?? []

  const statusBadgeClass = (status: AccessControlStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
    }
  }

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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.Name}</span>
                    {c.CameraAccess ? (
                      <span
                        className="flex items-center gap-1 text-xs text-primary"
                        title={[c.CameraEmail, c.CameraPhone].filter(Boolean).join(' · ')}
                      >
                        <Video className="h-3.5 w-3.5" />
                        {c.CameraEmail || c.CameraPhone}
                      </span>
                    ) : (
                      <VideoOff className="h-3.5 w-3.5 text-muted-foreground/30" />
                    )}
                  </div>
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

      {/* Users section — admin only */}
      {isAdmin && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            {t('detail.users')}
          </h2>
          {(houseUsers ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm py-2">{t('detail.noUsers')}</p>
          ) : (
            <div className="flex flex-col divide-y rounded-md border">
              {(houseUsers ?? []).map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm">{u.email}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.role === 'admin'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Access Controls section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('accessControls.title')}</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={handleEvaluate} disabled={evaluateHouse.isPending}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Evaluar
              </Button>
            )}
            {isAdmin && (
              <Dialog open={acFormOpen} onOpenChange={(open) => { setAcFormOpen(open); if (!open) setAcEditTarget(null) }}>
                <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t('accessControls.newAccessControl')}
                </DialogTrigger>
                <AccessControlFormDialog
                  houseID={houseID}
                  editTarget={acEditTarget}
                  onSuccess={() => {
                    setAcFormOpen(false)
                    setAcEditTarget(null)
                    toast.success(acEditTarget ? t('accessControls.toast.updated') : t('accessControls.toast.created'))
                  }}
                />
              </Dialog>
            )}
          </div>
        </div>

        {controls.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">{t('accessControls.noAccessControls')}</p>
        ) : (
          <div className="flex flex-col divide-y rounded-md border">
            {controls.map((ac) => (
              <div key={ac.ID} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ac.Code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeClass(ac.Status)}`}>
                      {t(`accessControls.statusLabels.${ac.Status}`)}
                    </span>
                    {!ac.PhysicalSyncedAt && (
                      <span className="h-2 w-2 rounded-full bg-yellow-400" title={t('accessControls.pendingSync')} />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {t('accessControls.adminNumber')}: {ac.AdminNumber}
                    {ac.Notes ? ` · ${ac.Notes}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    title={t('accessControls.markSynced')}
                    onClick={() => handleMarkSynced(ac)}
                    disabled={markSynced.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {isAdmin && (
                    <>
                      <Select
                        value={ac.Status}
                        onValueChange={(v) => handleChangeStatus(ac, v as AccessControlStatus)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('accessControls.statusLabels.active')}</SelectItem>
                          <SelectItem value="warning">{t('accessControls.statusLabels.warning')}</SelectItem>
                          <SelectItem value="inactive">{t('accessControls.statusLabels.inactive')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setAcEditTarget(ac); setAcFormOpen(true) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAC(ac)}
                        disabled={deleteAC.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vehicles section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('vehicles.title')}</h2>
          <Dialog open={vehicleFormOpen} onOpenChange={(open) => { setVehicleFormOpen(open); if (!open) setVehicleEditTarget(null) }}>
            <DialogTrigger render={<Button size="sm" />}>
              <Car className="h-4 w-4 mr-1" />
              {t('vehicles.addVehicle')}
            </DialogTrigger>
            <VehicleFormDialog
              houseID={houseID}
              editTarget={vehicleEditTarget}
              onSuccess={() => {
                setVehicleFormOpen(false)
                setVehicleEditTarget(null)
                toast.success(vehicleEditTarget ? t('vehicles.toast.updated') : t('vehicles.toast.created'))
              }}
            />
          </Dialog>
        </div>

        {vehicleList.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4">{t('vehicles.noVehicles')}</p>
        ) : (
          <div className="flex flex-col divide-y rounded-md border">
            {vehicleList.map((v) => (
              <div key={v.ID} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{v.Plate}</span>
                  <span className="text-sm text-muted-foreground">
                    {v.Color}
                    {v.Brand ? ` · ${v.Brand}` : ''}
                    {v.Model ? ` ${v.Model}` : ''}
                  </span>
                  {(v.AccessControls?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(v.AccessControls ?? []).map((entry) => (
                        <span key={entry.AccessControlID} className="flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                          {entry.Code}
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive ml-1"
                            onClick={() => handleUnassignAC(v.ID, entry.AccessControlID)}
                            aria-label={t('vehicles.toast.unassigned')}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Dialog
                    open={vehicleAssignTarget?.ID === v.ID}
                    onOpenChange={(open) => setVehicleAssignTarget(open ? v : null)}
                  >
                    <DialogTrigger render={<Button size="sm" variant="outline" />}>
                      <Plus className="h-4 w-4" />
                    </DialogTrigger>
                    {vehicleAssignTarget?.ID === v.ID && (
                      <VehicleAssignControlDialog
                        vehicle={v}
                        onSuccess={() => {
                          setVehicleAssignTarget(null)
                          toast.success(t('vehicles.toast.assigned'))
                        }}
                      />
                    )}
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setVehicleEditTarget(v); setVehicleFormOpen(true) }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteVehicle(v)}
                    disabled={deleteVehicle.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// AccessControlFormDialog — create or edit
type AccessControlFormDialogProps = {
  houseID: number
  editTarget: AccessControl | null
  onSuccess: () => void
}

function AccessControlFormDialog({ houseID, editTarget, onSuccess }: AccessControlFormDialogProps) {
  const { t } = useTranslation('houses')
  const createAC = useCreateAccessControl(houseID)
  const updateAC = useUpdateAccessControl()
  const [code, setCode] = useState(editTarget?.Code ?? '')
  const [adminNumber, setAdminNumber] = useState(editTarget?.AdminNumber ?? '')
  const [notes, setNotes] = useState(editTarget?.Notes ?? '')
  const [error, setError] = useState('')

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
          <Label htmlFor="ac-admin-number">{t('accessControls.adminNumber')}</Label>
          <Input
            id="ac-admin-number"
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
        <Button type="submit" disabled={isPending}>
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

// VehicleFormDialog — create or edit
type VehicleFormDialogProps = {
  houseID: number
  editTarget: Vehicle | null
  onSuccess: () => void
}

function VehicleFormDialog({ houseID, editTarget, onSuccess }: VehicleFormDialogProps) {
  const { t } = useTranslation('houses')
  const createVehicle = useCreateVehicle(houseID)
  const updateVehicle = useUpdateVehicle()
  const [plate, setPlate] = useState(editTarget?.Plate ?? '')
  const [color, setColor] = useState(editTarget?.Color ?? '')
  const [brand, setBrand] = useState(editTarget?.Brand ?? '')
  const [model, setModel] = useState(editTarget?.Model ?? '')
  const [notes, setNotes] = useState(editTarget?.Notes ?? '')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      if (editTarget) {
        await updateVehicle.mutateAsync({ id: editTarget.ID, data: { plate, color, brand, model, notes } })
      } else {
        await createVehicle.mutateAsync({ plate, color, brand, model, notes })
      }
      onSuccess()
    } catch (err: unknown) {
      setError((err as Error).message || t(editTarget ? 'vehicles.toast.errorUpdate' : 'vehicles.toast.errorCreate'))
    }
  }

  const isPending = createVehicle.isPending || updateVehicle.isPending

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {editTarget ? t('vehicles.form.editTitle') : t('vehicles.form.title')}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-2">
          <Label htmlFor="v-plate">{t('vehicles.plate')}</Label>
          <Input
            id="v-plate"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder={t('vehicles.form.platePlaceholder')}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="v-color">{t('vehicles.color')}</Label>
          <Input
            id="v-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder={t('vehicles.form.colorPlaceholder')}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="v-brand">{t('vehicles.brand')}</Label>
          <Input
            id="v-brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder={t('vehicles.form.brandPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="v-model">{t('vehicles.model')}</Label>
          <Input
            id="v-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={t('vehicles.form.modelPlaceholder')}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="v-notes">{t('vehicles.notes')}</Label>
          <Input
            id="v-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('vehicles.form.notesPlaceholder')}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? t('vehicles.form.submitting')
            : editTarget
              ? t('vehicles.form.submitUpdate')
              : t('vehicles.form.submit')}
        </Button>
      </form>
    </DialogContent>
  )
}

// VehicleAssignControlDialog — assign an access control to a vehicle by code lookup
type VehicleAssignControlDialogProps = {
  vehicle: Vehicle
  onSuccess: () => void
}

function VehicleAssignControlDialog({ vehicle, onSuccess }: VehicleAssignControlDialogProps) {
  const { t } = useTranslation('houses')
  const assignAC = useAssignAccessControl()
  const { lookup, reset, result, error: lookupError, isLoading: isLooking } = useLookupAccessControlByCode()
  const [code, setCode] = useState('')
  const [submitError, setSubmitError] = useState('')

  const assignedIDs = new Set((vehicle.AccessControls ?? []).map((e) => e.AccessControlID))
  const alreadyAssigned = result ? assignedIDs.has(result.ID) : false

  function handleCodeChange(value: string) {
    setCode(value)
    if (result || lookupError) reset()
  }

  async function handleLookup(e: FormEvent) {
    e.preventDefault()
    if (code.trim()) lookup(code.trim())
  }

  async function handleAssign() {
    if (!result) return
    setSubmitError('')
    try {
      await assignAC.mutateAsync({ vehicleID: vehicle.ID, controlID: result.ID })
      setCode('')
      reset()
      onSuccess()
    } catch (err: unknown) {
      setSubmitError((err as Error).message || t('vehicles.toast.errorAssign'))
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{t('vehicles.assignControl.title')}</DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <form onSubmit={handleLookup} className="flex gap-2">
          <Input
            placeholder={t('vehicles.assignControl.codePlaceholder')}
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            autoFocus
          />
          <Button type="submit" variant="outline" disabled={isLooking || !code.trim()}>
            {isLooking ? t('vehicles.assignControl.searching') : t('vehicles.assignControl.search')}
          </Button>
        </form>

        {lookupError && (
          <p className="text-sm text-destructive">{t('vehicles.assignControl.notFound')}</p>
        )}

        {result && (
          <div className="rounded-md border p-3 flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{t('accessControls.adminNumber')}: {result.AdminNumber}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                result.Status === 'active' ? 'bg-green-100 text-green-700' :
                result.Status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {t(`accessControls.statusLabels.${result.Status}`)}
              </span>
            </div>
            {result.Notes && <span className="text-muted-foreground">{result.Notes}</span>}
            {alreadyAssigned && (
              <p className="text-xs text-amber-600 mt-1">{t('vehicles.assignControl.alreadyAssigned')}</p>
            )}
          </div>
        )}

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <Button
          onClick={handleAssign}
          disabled={!result || alreadyAssigned || assignAC.isPending}
        >
          {assignAC.isPending ? t('vehicles.form.submitting') : t('assign.submit')}
        </Button>
      </div>
    </DialogContent>
  )
}