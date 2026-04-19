import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { House } from '@/types/house'

type HouseTableProps = {
  houses: House[]
  onEdit: (house: House) => void
  onDelete: (id: number) => void
}

export function HouseTable({ houses, onEdit, onDelete }: HouseTableProps) {
  const { t } = useTranslation('houses')

  return (
    <>
      {/* Mobile cards */}
      <div className="flex flex-col divide-y md:hidden">
        {houses.map((house) => (
          <div key={house.ID} className="flex items-start justify-between py-3 gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Link to={`/houses/${house.ID}`} className="font-medium truncate hover:underline">
                {house.Name}
              </Link>
              {house.Address && (
                <span className="text-sm text-muted-foreground truncate">{house.Address}</span>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(house)}>
                {t('common:buttons.edit')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-7 px-2"
                onClick={() => onDelete(house.ID)}
              >
                {t('common:buttons.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.name')}</TableHead>
              <TableHead>{t('table.address')}</TableHead>
              <TableHead>{t('table.notes')}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {houses.map((house) => (
              <TableRow key={house.ID}>
                <TableCell>
                  <Link to={`/houses/${house.ID}`} className="font-medium hover:underline">
                    {house.Name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{house.Address || '—'}</TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {house.Notes || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(house)}>
                      {t('common:buttons.edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(house.ID)}
                    >
                      {t('common:buttons.delete')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}