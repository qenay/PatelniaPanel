import { useState, useEffect, useCallback } from 'react'
import { db } from '../lib/db.js'

/* Reaktywne hooki nad warstwą danych (db).
   db emituje zdarzenie 'panel:change' przy każdym zapisie — hooki nasłuchują
   i odświeżają dane. Przy migracji na Supabase wystarczy zmienić db.js. */

function useDbValue(getter, deps = []) {
  const [value, setValue] = useState(getter)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = useCallback(() => setValue(getter()), deps)
  useEffect(() => {
    refresh()
    window.addEventListener('panel:change', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('panel:change', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [refresh])
  return value
}

export function useEvents() {
  return useDbValue(() => db.getEvents())
}

export function useEventsOfMonth(ym) {
  return useDbValue(() => (ym ? db.eventsOfMonth(ym) : []), [ym])
}

export function useMonth(ym) {
  return useDbValue(() => (ym ? db.getMonth(ym) : null), [ym])
}

export function useAvailableMonths() {
  return useDbValue(() => db.availableMonths())
}
