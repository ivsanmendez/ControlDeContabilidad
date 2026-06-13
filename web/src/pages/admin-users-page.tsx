import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUsers, useUpdateUserRole, useUpdateUserPassword, useDeleteUser } from '@/hooks/use-user-admin'
import { useAuth } from '@/hooks/use-auth'
import type { UserAdmin } from '@/types/user-admin'

function roleBadgeClass(role: UserAdmin['role']) {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'
  return role === 'admin'
    ? `${base} bg-green-100 text-green-800`
    : `${base} bg-gray-100 text-gray-700`
}

function ChangeRoleDialog({
  target,
  open,
  onClose,
}: {
  target: UserAdmin
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('users')
  const [role, setRole] = useState<'user' | 'admin'>(target.role)
  const updateRole = useUpdateUserRole()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updateRole.mutate(
      { id: target.id, data: { role } },
      {
        onSuccess: () => {
          toast.success(t('changeRole.success'))
          onClose()
        },
        onError: () => toast.error(t('changeRole.error')),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('changeRole.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>{t('changeRole.label')}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'admin')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('roles.user')}</SelectItem>
                <SelectItem value="admin">{t('roles.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={updateRole.isPending}>
              {updateRole.isPending ? t('changeRole.submitting') : t('changeRole.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChangePasswordDialog({
  target,
  open,
  onClose,
}: {
  target: UserAdmin
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('users')
  const [password, setPassword] = useState('')
  const updatePassword = useUpdateUserPassword()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    updatePassword.mutate(
      { id: target.id, data: { password } },
      {
        onSuccess: () => {
          toast.success(t('changePassword.success'))
          onClose()
        },
        onError: () => toast.error(t('changePassword.error')),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('changePassword.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>{t('changePassword.label')}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('changePassword.placeholder')}
              required
              minLength={8}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? t('changePassword.submitting') : t('changePassword.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({
  target,
  open,
  onClose,
}: {
  target: UserAdmin
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation('users')
  const deleteUser = useDeleteUser()

  function handleDelete() {
    deleteUser.mutate(target.id, {
      onSuccess: () => {
        toast.success(t('deleteUser.success'))
        onClose()
      },
      onError: () => toast.error(t('deleteUser.error')),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteUser.title')}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground pt-2">
          {t('deleteUser.confirm', { email: target.email })}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={deleteUser.isPending}>
            {t('changeRole.submit')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteUser.isPending}
          >
            {deleteUser.isPending ? t('deleteUser.submitting') : t('deleteUser.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type DialogType = 'role' | 'password' | 'delete'

export function AdminUsersPage() {
  const { t } = useTranslation('users')
  const { user: currentUser } = useAuth()
  const { data: users, isLoading, isError } = useUsers()

  const [dialogTarget, setDialogTarget] = useState<UserAdmin | null>(null)
  const [dialogType, setDialogType] = useState<DialogType | null>(null)

  function openDialog(u: UserAdmin, type: DialogType) {
    setDialogTarget(u)
    setDialogType(type)
  }

  function closeDialog() {
    setDialogTarget(null)
    setDialogType(null)
  }

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

  const items = users ?? []

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {items.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">{t('table.email')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('table.role')}</th>
                <th className="px-4 py-3 text-left font-medium">{t('table.createdAt')}</th>
                <th className="px-4 py-3 text-right font-medium">{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={roleBadgeClass(u.role)}>{t(`roles.${u.role}`)}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(u, 'role')}
                      >
                        {t('changeRole.title')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(u, 'password')}
                      >
                        {t('changePassword.title')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => openDialog(u, 'delete')}
                        disabled={currentUser?.id === u.id}
                      >
                        {t('deleteUser.title')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dialogTarget && dialogType === 'role' && (
        <ChangeRoleDialog
          target={dialogTarget}
          open
          onClose={closeDialog}
        />
      )}
      {dialogTarget && dialogType === 'password' && (
        <ChangePasswordDialog
          target={dialogTarget}
          open
          onClose={closeDialog}
        />
      )}
      {dialogTarget && dialogType === 'delete' && (
        <DeleteUserDialog
          target={dialogTarget}
          open
          onClose={closeDialog}
        />
      )}
    </div>
  )
}