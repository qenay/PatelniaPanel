import { num } from './format.js'

// ── Bilety ──────────────────────────────────────────────────────────────
export function ticketRows(ev) {
  const b = ev.bilety || {}
  const online = b.online || { ilosc: 0, cena: 0 }
  const sprzedaz = b.sprzedaz || { ilosc: 0, cena: 0 }
  const darmowe_do23 = b.darmowe_do23 || { ilosc: 0 }
  const darmowe = b.darmowe || { ilosc: 0 }
  return [
    { key: 'online', label: 'Online', ilosc: num(online.ilosc), cena: num(online.cena), suma: num(online.ilosc) * num(online.cena) },
    { key: 'sprzedaz', label: 'Sprzedaż (kasa)', ilosc: num(sprzedaz.ilosc), cena: num(sprzedaz.cena), suma: num(sprzedaz.ilosc) * num(sprzedaz.cena) },
    { key: 'darmowe_do23', label: 'Za darmo do 23:00', ilosc: num(darmowe_do23.ilosc), cena: 0, suma: 0 },
    { key: 'darmowe', label: 'Darmowe', ilosc: num(darmowe.ilosc), cena: 0, suma: 0 },
  ]
}

export function totalGuests(ev) {
  return ticketRows(ev).reduce((s, r) => s + r.ilosc, 0)
}

export function ticketRevenue(ev) {
  return ticketRows(ev).reduce((s, r) => s + r.suma, 0)
}

// ── Przychody (stacje) ──────────────────────────────────────────────────
// Suma wiersza = gotówka + terminal + superboss + payu.
// "Raport fiskalny" to pole kontrolne (odczyt kasy fiskalnej) — NIE wlicza się do sumy.
export function rowRevenue(r) {
  return num(r.gotowka) + num(r.terminal) + num(r.superboss) + num(r.payu)
}

export function revenueTotals(ev) {
  const rows = ev.przychody || []
  let gotowka = 0, terminal = 0, raport = 0, superboss = 0, payu = 0, bary = 0, suma = 0
  rows.forEach((r) => {
    gotowka += num(r.gotowka)
    terminal += num(r.terminal)
    raport += num(r.raport_fiskalny)
    superboss += num(r.superboss)
    payu += num(r.payu)
    const rev = rowRevenue(r)
    suma += rev
    if (r.bar) bary += rev
  })
  return {
    gotowka, terminal, raport, superboss, payu,
    przelewy: superboss + payu,
    bary,
    suma, // przychód całkowity
  }
}

// ── Koszty / premie ─────────────────────────────────────────────────────
export function kosztKwota(k) {
  return k.stawka != null ? num(k.osoby) * num(k.stawka) : num(k.kwota)
}
export function costsTotal(ev) {
  return (ev.koszty || []).reduce((s, k) => s + kosztKwota(k), 0)
}
// niezapłacone koszty wydarzenia
export function unpaidEventCosts(ev) {
  const items = (ev.koszty || []).filter((k) => !k.zaplacono && kosztKwota(k) > 0)
  return { items, sum: items.reduce((s, k) => s + kosztKwota(k), 0) }
}
// niezapłacone koszty z listy miesięcznej (stałe/pozostałe)
export function unpaidRows(rows) {
  const items = (rows || []).filter((r) => !r.zaplacono && num(r.kwota) > 0)
  return { items, sum: items.reduce((s, r) => s + num(r.kwota), 0) }
}
export function costsPaid(ev) {
  return (ev.koszty || []).filter((k) => k.zaplacono).reduce((s, k) => s + num(k.kwota), 0)
}
export function premieTotal(ev) {
  return (ev.premie || []).reduce((s, p) => s + num(p.kwota), 0)
}

// ── Pełne metryki wydarzenia ────────────────────────────────────────────
export function eventMetrics(ev) {
  const guests = totalGuests(ev)
  const rev = revenueTotals(ev)
  const koszty = costsTotal(ev)
  const premie = premieTotal(ev)
  const kosztyImprezy = koszty + premie
  const przychod = rev.suma
  const zysk = przychod - kosztyImprezy
  const srOgolna = guests > 0 ? przychod / guests : 0
  const srBarowa = guests > 0 ? rev.bary / guests : 0
  const gotowkaPoKosztach = rev.gotowka - num(ev.kosztGotowkowy)
  return {
    guests,
    przychod,
    przychodBary: rev.bary,
    koszty,
    premie,
    kosztyImprezy,
    zysk,
    srOgolna,
    srBarowa,
    gotowka: rev.gotowka,
    terminal: rev.terminal,
    przelewy: rev.przelewy,
    raport: rev.raport,
    gotowkaPoKosztach,
    ticketRevenue: ticketRevenue(ev),
  }
}

// ── Agregaty miesiąca ───────────────────────────────────────────────────
export function monthFixedTotal(month) {
  return (month?.koszty_stale || []).reduce((s, k) => s + num(k.kwota), 0)
}
export function monthOtherTotal(month) {
  return (month?.koszty_pozostale || []).reduce((s, k) => s + num(k.kwota), 0)
}
export function monthExtraRevenue(month) {
  return (month?.przychody_inne || []).reduce((s, r) => s + num(r.wartosc), 0)
}

export function monthSummary(events, month) {
  const evMetrics = events.map(eventMetrics)
  const przychodyImprez = evMetrics.reduce((s, m) => s + m.przychod, 0)
  const kosztyImprez = evMetrics.reduce((s, m) => s + m.kosztyImprezy, 0)
  const guests = evMetrics.reduce((s, m) => s + m.guests, 0)
  const bary = evMetrics.reduce((s, m) => s + m.przychodBary, 0)
  const gotowka = evMetrics.reduce((s, m) => s + m.gotowka, 0)
  const przychodyInne = monthExtraRevenue(month)
  const kosztyStale = monthFixedTotal(month)
  const kosztyPozostale = monthOtherTotal(month)

  const przychodyLacznie = przychodyImprez + przychodyInne
  const kosztyLacznie = kosztyStale + kosztyPozostale + kosztyImprez
  const zysk = przychodyLacznie - kosztyLacznie
  const gotowkaPoKosztach = gotowka - (kosztyStale + kosztyPozostale + kosztyImprez)

  return {
    liczbaImprez: events.length,
    guests,
    bary,
    srOgolna: guests > 0 ? przychodyImprez / guests : 0,
    srBarowa: guests > 0 ? bary / guests : 0,
    przychodyImprez,
    przychodyInne,
    przychodyLacznie,
    kosztyStale,
    kosztyPozostale,
    kosztyImprez,
    kosztyLacznie,
    zysk,
    gotowkaPoKosztach,
    marza: przychodyLacznie > 0 ? (zysk / przychodyLacznie) * 100 : 0,
  }
}
