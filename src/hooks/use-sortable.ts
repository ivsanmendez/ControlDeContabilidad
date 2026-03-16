import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export type SortState<K extends string> = {
  key: K
  direction: SortDirection
}

export function useSortable<T, K extends string>(
  data: T[] | undefined,
  comparators: Record<K, (a: T, b: T) => number>,
  defaultKey?: K,
) {
  const [sort, setSort] = useState<SortState<K> | null>(
    defaultKey ? { key: defaultKey, direction: 'asc' } : null,
  )

  function toggleSort(key: K) {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  const sorted = useMemo(() => {
    if (!data) return data
    if (!sort) return data
    const cmp = comparators[sort.key]
    const dir = sort.direction === 'asc' ? 1 : -1
    return [...data].sort((a, b) => cmp(a, b) * dir)
  }, [data, sort, comparators])

  return { sorted, sort, toggleSort } as const
}
