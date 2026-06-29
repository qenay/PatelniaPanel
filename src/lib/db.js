import { v4 as uuid } from 'uuid'
import { ymOf } from './format.js'

/* ============================================================================
   WARSTWA DANYCH
   Cała komunikacja z magazynem jest tutaj. Aby przejść na Supabase,
   wystarczy podmienić ciało funkcji read()/write() (oraz uczynić je async)
   — reszta aplikacji korzysta tylko z eksportowanego API `db`.
   ========================================================================== */

const EVENTS_KEY = 'panel.events'
const MONTHS_KEY = 'panel.months'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent('panel:change'))
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
  const mk = (nazwa) => ({ id: uuid(), nazwa, forma: 'przelew', data: '', kwota: 0 })
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

/* ── API ─────────────────────────────────────────────────────────────────── */

export const db = {
  // EVENTS
  getEvents() {
    const list = read(EVENTS_KEY, [])
    return [...list].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
  },
  getEvent(id) {
    return read(EVENTS_KEY, []).find((e) => e.id === id) || null
  },
  saveEvent(ev) {
    const list = read(EVENTS_KEY, [])
    const i = list.findIndex((e) => e.id === ev.id)
    if (i >= 0) list[i] = ev
    else list.push(ev)
    write(EVENTS_KEY, list)
    return ev
  },
  deleteEvent(id) {
    write(EVENTS_KEY, read(EVENTS_KEY, []).filter((e) => e.id !== id))
  },
  eventsOfMonth(ym) {
    return this.getEvents().filter((e) => ymOf(e.data) === ym)
  },
  availableMonths() {
    const set = new Set(this.getEvents().map((e) => ymOf(e.data)).filter(Boolean))
    read(MONTHS_KEY, {}) && Object.keys(read(MONTHS_KEY, {})).forEach((m) => set.add(m))
    return [...set].sort().reverse()
  },

  // DEMO
  seedDemo() {
    if (this.getEvents().length) return
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
    write(EVENTS_KEY, list)
    const m6 = newMonth('2026-06')
    m6.koszty_stale = m6.koszty_stale.map((k) => ({ ...k, kwota: { 'Czynsz': 12000, 'Prąd': 3200, 'ZAIKS': 1500, 'Internet': 200 }[k.nazwa] || 0, data: '2026-06-05' }))
    m6.przychody_inne = [{ id: uuid(), data: '2026-06-20', nazwa: 'Wynajem sali (komunia)', wartosc: 4500 }]
    const m5 = newMonth('2026-05')
    m5.koszty_stale = m5.koszty_stale.map((k) => ({ ...k, kwota: { 'Czynsz': 12000, 'Prąd': 2800 }[k.nazwa] || 0 }))
    const all = {}; all['2026-06'] = m6; all['2026-05'] = m5
    write(MONTHS_KEY, all)
  },
  clearAll() {
    localStorage.removeItem(EVENTS_KEY)
    localStorage.removeItem(MONTHS_KEY)
    window.dispatchEvent(new CustomEvent('panel:change'))
  },

  // KOPIA ZAPASOWA
  exportAll() {
    return {
      app: 'panel-menago-patelnia',
      version: 1,
      exportedAt: new Date().toISOString(),
      events: read(EVENTS_KEY, []),
      months: read(MONTHS_KEY, {}),
    }
  },
  importAll(data) {
    if (!data || !Array.isArray(data.events) || typeof data.months !== 'object') {
      throw new Error('Nieprawidłowy plik kopii.')
    }
    localStorage.setItem(EVENTS_KEY, JSON.stringify(data.events))
    localStorage.setItem(MONTHS_KEY, JSON.stringify(data.months))
    window.dispatchEvent(new CustomEvent('panel:change'))
  },

  // MONTHS (koszty stałe / pozostałe / przychody inne)
  getMonth(ym) {
    const all = read(MONTHS_KEY, {})
    return all[ym] || newMonth(ym)
  },
  saveMonth(month) {
    const all = read(MONTHS_KEY, {})
    all[month.miesiac] = month
    write(MONTHS_KEY, all)
  },
}
