import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateContribution, useUpdateContribution } from '@/hooks/use-contributions'
import { useContributors } from '@/hooks/use-contributors'
import { useCategories } from '@/hooks/use-categories'
import { PAYMENT_METHODS, getPaymentMethodLabel, getMonthLabel } from '@/lib/constants'
import { ApiClientError } from '@/lib/api-client'
import type { PaymentMethod, ContributionDetail } from '@/types/contribution'

type ContributionFormProps = {
  onSuccess: () => void
  contribution?: ContributionDetail
}

export function ContributionForm({ onSuccess, contribution }: ContributionFormProps) {
  const isEditing = !!contribution
  const createContribution = useCreateContribution()
  const updateContribution = useUpdateContribution()
  const { data: contributors } = useContributors()
  const { data: categories } = useCategories()
  const { t } = useTranslation('contributions')
  const [contributorId, setContributorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [month, setMonth] = useState(() => String(new Date().getMonth() + 1))
  const [year, setYear] = useState(() => String(new Date().getFullYear()))
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [error, setError] = useState('')

  useEffect(() => {
    if (contribution) {
      setContributorId(String(contribution.ContributorID))
      setCategoryId(String(contribution.CategoryID))
      setAmount(String(contribution.Amount))
      setMonth(String(contribution.Month))
      setYear(String(contribution.Year))
      setPaymentDate(contribution.PaymentDate.split('T')[0])
      setPaymentMethod(contribution.PaymentMethod)
    }
  }, [contribution])

  const isPending = isEditing ? updateContribution.isPending : createContribution.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!contributorId) {
      setError(t('form.errorSelectContributor'))
      return
    }
    if (!categoryId) {
      setError(t('form.errorSelectCategory'))
      return
    }

    const payload = {
      contributor_id: parseInt(contributorId, 10),
      category_id: parseInt(categoryId, 10),
      amount: parseFloat(amount),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      payment_date: paymentDate,
      payment_method: paymentMethod,
    }

    try {
      if (isEditing) {
        await updateContribution.mutateAsync({ id: contribution.ID, data: payload })
      } else {
        await createContribution.mutateAsync(payload)
      }
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError(isEditing ? t('form.errorUpdate') : t('form.errorCreate'))
      }
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditing ? t('form.titleEdit') : t('form.title')}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 col-span-2">
            <Label htmlFor="contributor">{t('form.contributor')}</Label>
            <Select value={contributorId} onValueChange={(v) => v && setContributorId(v)}>
              <SelectTrigger id="contributor">
                <SelectValue placeholder={t('form.selectContributor')}>
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
          <div className="flex flex-col gap-2 col-span-2">
            <Label htmlFor="category">{t('form.category')}</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger id="category">
                <SelectValue placeholder={t('form.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {(categories ?? [])
                  .filter((cat) => cat.IsActive)
                  .map((cat) => (
                    <SelectItem key={cat.ID} value={String(cat.ID)}>
                      {cat.Name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">{t('form.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="month">{t('form.month')}</Label>
            <Select value={month} onValueChange={(v) => v && setMonth(v)}>
              <SelectTrigger id="month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {getMonthLabel(t, m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="year">{t('form.year')}</Label>
            <Input
              id="year"
              type="number"
              min="2000"
              required
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="paymentDate">{t('form.paymentDate')}</Label>
            <Input
              id="paymentDate"
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="paymentMethod">{t('form.paymentMethod')}</Label>
          <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v as PaymentMethod)}>
            <SelectTrigger id="paymentMethod">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {getPaymentMethodLabel(t, m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? (isEditing ? t('form.submittingEdit') : t('form.submitting'))
            : (isEditing ? t('form.submitEdit') : t('form.submit'))}
        </Button>
      </form>
    </DialogContent>
  )
}
