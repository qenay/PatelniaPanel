import { v4 as uuid } from 'uuid'
import { ymOf } from './format.js'
import { supabase } from './supabase.js'

/* ============================================================================
   WARSTWA DANYCH — Supabase (wspólna baza w chmurze)

   Dane trzymane są we wspólnej bazie Supabase. W przeglądarce działa szybki
   cache w pamięci (żeby UI pozostało synchroniczne), a zmiany:
   - zapisują się optymistycznie do cache (natychmiastowy UI) i do Supabase,
   - przychodzące od innych użytkowników (realtime) odświeżają cache.
   Cała komunikacja z bazą jest TUTAJ.
   ========================================================================== */

let cache = { events: [], months: {} }
let ready = false
let initStarted = false

function emit() {
  window.dispatchEvent(new CustomEvent('panel:change'))
}

async function loadAll() {
  const [evRes, moRes] = await Promise.all([
    supabase.from('events').select('id,data'),
    supabase.from('months').select('miesiac,data'),
  ])
  if (evRes.error) console.error('load events', evRes.error)
  if (moRes.error) console.error('load months', moRes.error)
  cache.events = (evRes.data || []).map((r) => r.data)
  cache.months = {}
  ;(moRes.data || []).forEach((r) => { cache.months[r.miesiac] = r.data })
}

/* ── Fabryki domyślnych struktur ─────────────────────────────────────────── */

export function defaultPrzychody() {
  const mk = (nazwa, bar = false) => ({
    id: uuid(), nazwa, bar,
    gotowka: 0, terminal: 0, raport_fiskalny: 0, superboss: 0, payu: 0,
  })
  return [
    mk('Kasa biletowa'),
    mk('Loże'),
    mk('Szatnia'),
    mk('Bar Duży 1', true),
    mk('Bar Duży 2', true),
    mk('Bar Mały', true),
    mk('Bar Mała Sala', true),
    mk('Bar Disco', true),
  ]
}

export function defaultKoszty() {
  const mk = (nazwa, extra = {}) => ({ id: uuid(), nazwa, kwota: 0, zaplacono: false, ...extra })
  return [
    mk('DJ CLUBOWA'),
    mk('LJ'),
    mk('DJ SALA DISCO'),
    mk('Ochrona', { osoby: 0, stawka: 350 }),
    mk('Łukasz kierownik ochrony dopłata'),
    mk('Kasa'),
    mk('Bar Duży 1'),
    mk('Bar Duży 2'),
    mk('Bar Mały'),
    mk('Bar Disco'),
    mk('Szef Baru'),
    mk('Service'),
    mk('Kelnerka'),
    mk('Szatnia'),
    mk('Foto i nagrania'),
  ]
}

export function newEvent() {
  return {
    id: uuid(),
    nazwa: '',
    data: new Date().toISOString().slice(0, 10),
    opis: '',
    bilety: {
      online: { ilosc: 0, cena: 20 },
      sprzedaz: { ilosc: 0, cena: 20 },
      darmowe_do23: { ilosc: 0 },
      darmowe: { ilosc: 0 },
    },
    przychody: defaultPrzychody(),
    koszty: defaultKoszty(),
    premie: [],
    kosztGotowkowy: 0,
  }
}

export function defaultKosztyStale() {
  const mk = (nazwa) => ({ id: uuid(), nazwa, forma: 'przelew', data: '', kwota: 0, zaplacono: false })
  return [
    mk('Czynsz'), mk('Prąd'), mk('Śmieci'), mk('ZAIKS'), mk('Biuro rachunkowe'),
    mk('Internet'), mk('GOPOS licencja'), mk('SuperBoss prowizja'),
    mk('Ochrona (stała)'), mk('Ubezpieczenie'),
  ]
}

export function newMonth(ym) {
  return {
    miesiac: ym,
    koszty_stale: defaultKosztyStale(),
    koszty_pozostale: [],
    przychody_inne: [],
  }
}

/* ── Zapisy do Supabase (po cichu, optymistycznie) ───────────────────────── */
function pushEvent(ev) {
  supabase.from('events').upsert({ id: ev.id, data: ev, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('saveEvent', error) })
}
function pushMonth(month) {
  supabase.from('months').upsert({ miesiac: month.miesiac, data: month, updated_at: new Date().toISOString() })
    .then(({ error }) => { if (error) console.error('saveMonth', error) })
}

/* ── API ─────────────────────────────────────────────────────────────────── */

export const db = {
  async init() {
    if (initStarted) return
    initStarted = true
    await loadAll()
    ready = true
    emit()
    supabase
      .channel('panel-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, async () => { await loadAll(); emit() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'months' }, async () => { await loadAll(); emit() })
      .subscribe()
  },
  isReady() { return ready },

  // EVENTS
  getEvents() {
    return [...cache.events].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  },
  getEvent(id) {
    return cache.events.find((e) => e.id === id) || null
  },
  saveEvent(ev) {
    const i = cache.events.findIndex((e) => e.id === ev.id)
    if (i >= 0) cache.events[i] = ev
    else cache.events.push(ev)
    emit()
    pushEvent(ev)
    return ev
  },
  deleteEvent(id) {
    cache.events = cache.events.filter((e) => e.id !== id)
    emit()
    supabase.from('events').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteEvent', error) })
  },
  eventsOfMonth(ym) {
    return this.getEvents().filter((e) => ymOf(e.data) === ym)
  },
  availableMonths() {
    const set = new Set(this.getEvents().map((e) => ymOf(e.data)).filter(Boolean))
    Object.keys(cache.months).forEach((m) => set.add(m))
    return [...set].sort().reverse()
  },

  // MONTHS
  getMonth(ym) {
    return cache.months[ym] || newMonth(ym)
  },
  saveMonth(month) {
    cache.months[month.miesiac] = month
    emit()
    pushMonth(month)
  },

  // DEMO
  seedDemo() {
    if (cache.events.length) return
    const ev = (nazwa, data, online, sprzedaz, free23, bars, koszt) => {
      const e = newEvent()
      e.nazwa = nazwa; e.data = data
      e.bilety.online = { ilosc: online, cena: 20 }
      e.bilety.sprzedaz = { ilosc: sprzedaz, cena: 20 }
      e.bilety.darmowe_do23 = { ilosc: free23 }
      e.przychody = e.przychody.map((r, i) => {
        if (r.nazwa === 'Kasa biletowa') return { ...r, gotowka: sprzedaz * 20, payu: online * 20 }
        if (r.bar) return { ...r, gotowka: bars[i % bars.length] || 0, terminal: Math.round((bars[i % bars.length] || 0) * 0.6) }
        return r
      })
      e.koszty = e.koszty.map((k) => k.nazwa === 'Ochrona' ? { ...k, osoby: 4, stawka: 350, kwota: 1400, zaplacono: true } : { ...k, kwota: koszt, zaplacono: Math.random() > 0.4 })
      return e
    }
    const list = [
      ev('Dyskoteka jak za dawnych lat', '2026-05-16', 120, 240, 30, [3200, 2800, 1500, 900, 2100], 600),
      ev('Noc Lata', '2026-06-13', 180, 300, 40, [4200, 3600, 1800, 1200, 2600], 700),
      ev('Retro Party', '2026-06-27', 90, 160, 20, [2200, 1900, 1100, 700, 1500], 550),
    ]
    const m6 = newMonth('2026-06')
    m6.koszty_stale = m6.koszty_stale.map((k) => ({ ...k, kwota: { 'Czynsz': 12000, 'Prąd': 3200, 'ZAIKS': 1500, 'Internet': 200 }[k.nazwa] || 0, data: '2026-06-05' }))
    m6.przychody_inne = [{ id: uuid(), data: '2026-06-20', nazwa: 'Wynajem sali (komunia)', wartosc: 4500 }]
    const m5 = newMonth('2026-05')
    m5.koszty_stale = m5.koszty_stale.map((k) => ({ ...k, kwota: { 'Czynsz': 12000, 'Prąd': 2800 }[k.nazwa] || 0 }))

    cache.events = list
    cache.months = { '2026-06': m6, '2026-05': m5 }
    emit()
    supabase.from('events').upsert(list.map((e) => ({ id: e.id, data: e }))).then(({ error }) => { if (error) console.error('seed events', error) })
    supabase.from('months').upsert([m6, m5].map((m) => ({ miesiac: m.miesiac, data: m }))).then(({ error }) => { if (error) console.error('seed months', error) })
  },
  clearAll() {
    cache = { events: [], months: {} }
    emit()
    supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    supabase.from('months').delete().neq('miesiac', '___none___')
  },

  // KOPIA ZAPASOWA
  exportAll() {
    return {
      app: 'panel-menago-patelnia',
      version: 1,
      exportedAt: new Date().toISOString(),
      events: cache.events,
      months: cache.months,
    }
  },
  async importAll(data) {
    if (!data || !Array.isArray(data.events) || typeof data.months !== 'object') {
      throw new Error('Nieprawidłowy plik kopii.')
    }
    cache.events = data.events
    cache.months = data.months
    emit()
    if (data.events.length) {
      const { error } = await supabase.from('events').upsert(data.events.map((e) => ({ id: e.id, data: e })))
      if (error) console.error('import events', error)
    }
    const monthRows = Object.values(data.months).map((m) => ({ miesiac: m.miesiac, data: m }))
    if (monthRows.length) {
      const { error } = await supabase.from('months').upsert(monthRows)
      if (error) console.error('import months', error)
    }
  },
}
