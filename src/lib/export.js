import * as XLSX from 'xlsx'
import { eventMetrics, ticketRows, monthSummary } from './calc.js'
import { monthLabel, formatDate } from './format.js'

function autoWidth(rows) {
  const w = []
  rows.forEach((r) => r.forEach((c, i) => {
    const len = (c == null ? '' : String(c)).length
    w[i] = Math.max(w[i] || 8, len + 2)
  }))
  return w.map((wch) => ({ wch }))
}
// format liczbowy: dokładnie do groszy
const MONEY_FMT = '#,##0.00'
function setNumFmt(ws, colIdxs, fmt = MONEY_FMT, firstRow = 1) {
  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let r = firstRow; r <= range.e.r; r++) {
    colIdxs.forEach((c) => {
      const ref = XLSX.utils.encode_cell({ r, c })
      const cell = ws[ref]
      if (cell && cell.t === 'n') cell.z = fmt
    })
  }
}
function sheet(rows, moneyCols = []) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = autoWidth(rows)
  if (moneyCols.length) setNumFmt(ws, moneyCols)
  return ws
}

export function exportMonthToExcel(ym, events, month) {
  const wb = XLSX.utils.book_new()
  const s = monthSummary(events, month)

  // 1) Podsumowanie miesiąca
  const sum = [
    [`Podsumowanie — ${monthLabel(ym)}`],
    [],
    ['Przychody z imprez', s.przychodyImprez],
    ['Przychody inne', s.przychodyInne],
    ['ŁĄCZNE PRZYCHODY', s.przychodyLacznie],
    [],
    ['Koszty stałe', s.kosztyStale],
    ['Koszty pozostałe', s.kosztyPozostale],
    ['Koszty imprez', s.kosztyImprez],
    ['ŁĄCZNE KOSZTY', s.kosztyLacznie],
    [],
    ['ZYSK MIESIĄCA', s.zysk],
    ['Gotówka po kosztach', s.gotowkaPoKosztach],
    ['Marża %', Math.round(s.marza * 10) / 10],
  ]
  XLSX.utils.book_append_sheet(wb, sheet(sum, [1]), 'Podsumowanie')

  // 2) Imprezy
  const imp = [['Data', 'Nazwa', 'Goście', 'Przychód', 'Koszty', 'Zysk', 'Śr. ogólna', 'Śr. barowa']]
  events.forEach((ev) => {
    const m = eventMetrics(ev)
    imp.push([formatDate(ev.data), ev.nazwa, m.guests, m.przychod, m.kosztyImprezy, m.zysk, Math.round(m.srOgolna * 100) / 100, Math.round(m.srBarowa * 100) / 100])
  })
  XLSX.utils.book_append_sheet(wb, sheet(imp, [3, 4, 5, 6, 7]), 'Imprezy')

  // 3) Bilety
  const bil = [['Wydarzenie', 'Data', 'Typ', 'Ilość', 'Cena', 'Suma']]
  events.forEach((ev) => {
    ticketRows(ev).forEach((r) => bil.push([ev.nazwa, formatDate(ev.data), r.label, r.ilosc, r.cena, r.suma]))
  })
  XLSX.utils.book_append_sheet(wb, sheet(bil, [4, 5]), 'Bilety')

  // 4) Koszty
  const k = [['Typ', 'Nazwa', 'Forma/Status', 'Data/—', 'Kwota']]
  ;(month?.koszty_stale || []).forEach((c) => k.push(['Stały', c.nazwa, c.forma, c.data, c.kwota]))
  ;(month?.koszty_pozostale || []).forEach((c) => k.push(['Pozostały', c.nazwa, c.forma, c.data, c.kwota]))
  events.forEach((ev) => (ev.koszty || []).forEach((c) => k.push(['Impreza: ' + ev.nazwa, c.nazwa, c.zaplacono ? 'zapłacono' : 'do zapłaty', '', c.kwota])))
  XLSX.utils.book_append_sheet(wb, sheet(k, [4]), 'Koszty')

  XLSX.writeFile(wb, `Panel_${ym}.xlsx`)
}

export function exportTicketsToExcel(events, labelSuffix = 'wszystkie') {
  const wb = XLSX.utils.book_new()
  const rows = [['Wydarzenie', 'Data', 'Typ', 'Ilość', 'Cena', 'Suma']]
  events.forEach((ev) => {
    ticketRows(ev).forEach((r) => rows.push([ev.nazwa, formatDate(ev.data), r.label, r.ilosc, r.cena, r.suma]))
    const m = eventMetrics(ev)
    rows.push([ev.nazwa, formatDate(ev.data), 'RAZEM', m.guests, '', m.ticketRevenue])
    rows.push([])
  })
  XLSX.utils.book_append_sheet(wb, sheet(rows, [4, 5]), 'Bilety')
  XLSX.writeFile(wb, `Bilety_${labelSuffix}.xlsx`)
}
