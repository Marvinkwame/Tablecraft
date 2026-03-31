'use client'

import { useState, useCallback } from 'react'

export function useFilterState(defaultValue = '') {
  const [value, setValue] = useState(defaultValue)

  const clear = useCallback(() => {
    setValue('')
  }, [])

  return {
    state: value,
    onGlobalFilterChange: setValue,
    clear,
  }
}
