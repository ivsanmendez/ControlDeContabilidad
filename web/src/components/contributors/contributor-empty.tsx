import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function ContributorEmpty({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation('contributors')

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12">
      <p className="text-muted-foreground">{t('empty')}</p>
      <Button onClick={onAdd}>{t('addFirst')}</Button>
    </div>
  )
}
