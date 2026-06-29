import { useState, useMemo, useRef } from 'react'
import { useEvents } from '../hooks/useStorage.js'
import { ticketRows, totalGuests, ticketRevenue } from '../lib/calc.js'
import { formatDate, formatPLN, formatNum, ymOf, monthLabel } from '../lib/format.js'
import { exportTicketsToExcel } from '../lib/export.js'
import { elementToPDF } from '../lib/pdf.js'
import { EmptyState } from '../components/ui.jsx'
import { PageHead } from './Wydarzenia.jsx'

export default function Bilety() {
  const events = useEvents()
  const [filter, setFilter] = useState('all')
  const reportRef = useRef(null)

  const months = useMemo(() => {
    const set = new Set(events.map((e) => ymOf(e.data)).filter(Boolean))
    return [...set].sort().reverse()
  }, [events])

  const filtered = filter === 'all' ? events : events.filter((e) => ymOf(e.data) === filter)

  return (
    <div>
      <PageHead
        title="Bilety"
        subtitle="Szczegóły sprzedaży biletów dla każdego wydarzenia."
        action={
          <div className="flex items-center gap-2">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input bg-white w-auto">
              <option value="all">Wszystkie miesiące</option>
              {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <button className="btn-ghost" onClick={() => exportTicketsToExcel(filtered, filter === 'all' ? 'wszystkie' : filter)}>📥 Excel</button>
            <button className="btn-navy" onClick={() => elementToPDF(reportRef.current, `Bilety_${filter === 'all' ? 'wszystkie' : filter}.pdf`)}>📄 PDF</button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <div className="card"><EmptyState>Brak wydarzeń{filter !== 'all' ? ' w tym miesiącu' : ''}.</EmptyState></div>
      ) : (
        <div ref={reportRef} data-pdf-root className="grid md:grid-cols-2 gap-5 bg-slate-100">
          {filtered.map((ev) => <TicketCard key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  )
}

function TicketCard({ ev }) {
  const rows = ticketRows(ev)
  return (
    <div className="card overflow-hidden">
      <div className="bg-navy text-white px-5 py-3 flex items-center justify-between gap-3">
        <span className="font-display font-bold flex items-center gap-2">🎵 {ev.nazwa || 'Bez nazwy'}</span>
        <span className="text-sm text-gold whitespace-nowrap">{formatDate(ev.data)}</span>
      </div>
      <div className="p-5">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="py-2 text-slate-600">{r.label}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">{formatNum(r.ilosc)} szt</td>
                <td className="py-2 text-right tabular-nums text-slate-400 whitespace-nowrap">× {r.cena} zł</td>
                <td className="py-2 text-right tabular-nums font-medium whitespace-nowrap">{formatPLN(r.suma)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-slate-200">
            <tr className="font-semibold">
              <td className="pt-3 text-navy">Łącznie gości</td>
              <td className="pt-3 text-right tabular-nums" colSpan={2}>{formatNum(totalGuests(ev))} os.</td>
              <td className="pt-3"></td>
            </tr>
            <tr className="font-bold">
              <td className="py-1 text-navy">Przychód z biletów</td>
              <td className="py-1 text-right text-gold-dk tabular-nums" colSpan={3}>{formatPLN(ticketRevenue(ev))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
