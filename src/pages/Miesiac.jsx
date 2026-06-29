import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db.js'
import { useEventsOfMonth } from '../hooks/useStorage.js'
import { eventMetrics, monthSummary } from '../lib/calc.js'
import { formatDate, formatPLN, formatNum, monthLabel, cls, profitClass } from '../lib/format.js'
import { exportMonthToExcel } from '../lib/export.js'
import { elementToPDF } from '../lib/pdf.js'
import { Card, EmptyState } from '../components/ui.jsx'
import MonthPicker, { currentYM } from '../components/MonthPicker.jsx'
import { CostTable, ExtraRevenueTable } from '../components/CostTables.jsx'
import { PageHead } from './Wydarzenia.jsx'
import MonthSummaryCard from '../components/MonthSummaryCard.jsx'

export default function Miesiac() {
  const [ym, setYm] = useState(currentYM())
  const events = useEventsOfMonth(ym)
  const [month, setMonth] = useState(() => db.getMonth(ym))
  const navigate = useNavigate()
  const reportRef = useRef(null)

  useEffect(() => { setMonth(db.getMonth(ym)) }, [ym])
  const patch = (p) => { const next = { ...month, ...p }; setMonth(next); db.saveMonth(next) }

  const s = monthSummary(events, month)

  return (
    <div>
      <PageHead
        title="Miesiąc"
        subtitle="Przegląd przychodów i kosztów w wybranym miesiącu."
        action={
          <div className="flex items-center gap-2">
            <MonthPicker value={ym} onChange={setYm} extra={db.availableMonths()} />
            <button className="btn-ghost" onClick={() => exportMonthToExcel(ym, events, month)}>📥 Excel</button>
            <button className="btn-navy" onClick={() => elementToPDF(reportRef.current, `Panel_${ym}.pdf`)}>📄 PDF</button>
          </div>
        }
      />

      <div ref={reportRef} data-pdf-root className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start bg-slate-100">
        <div className="space-y-6">
          {/* Imprezy w miesiącu */}
          <Card title={`🎵 Imprezy w tym miesiącu`}>
            {events.length === 0 ? (
              <EmptyState>Brak wydarzeń w tym miesiącu.</EmptyState>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead><tr>
                    <th className="th">Data</th><th className="th">Nazwa</th>
                    <th className="th text-right">Goście</th><th className="th text-right">Przychód</th>
                    <th className="th text-right">Koszty</th><th className="th text-right">Zysk</th>
                    <th className="th text-right">Śr. og.</th><th className="th text-right">Śr. bar.</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {events.map((ev) => {
                      const m = eventMetrics(ev)
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/wydarzenia/${ev.id}`)}>
                          <td className="td whitespace-nowrap text-slate-500">{formatDate(ev.data)}</td>
                          <td className="td font-semibold text-navy">{ev.nazwa || '—'}</td>
                          <td className="td text-right tabular-nums">{formatNum(m.guests)}</td>
                          <td className="td text-right tabular-nums">{formatPLN(m.przychod)}</td>
                          <td className="td text-right tabular-nums text-slate-500">{formatPLN(m.kosztyImprezy)}</td>
                          <td className={cls('td text-right tabular-nums font-semibold', profitClass(m.zysk))}>{formatPLN(m.zysk)}</td>
                          <td className="td text-right tabular-nums">{m.srOgolna.toFixed(1)}</td>
                          <td className="td text-right tabular-nums">{m.srBarowa.toFixed(1)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                    <tr>
                      <td className="td" colSpan={2}>SUMA</td>
                      <td className="td text-right tabular-nums">{formatNum(s.guests)}</td>
                      <td className="td text-right tabular-nums">{formatPLN(s.przychodyImprez)}</td>
                      <td className="td text-right tabular-nums">{formatPLN(s.kosztyImprez)}</td>
                      <td className={cls('td text-right tabular-nums', profitClass(s.przychodyImprez - s.kosztyImprez))}>{formatPLN(s.przychodyImprez - s.kosztyImprez)}</td>
                      <td className="td text-right tabular-nums">{s.srOgolna.toFixed(1)}</td>
                      <td className="td text-right tabular-nums">{s.srBarowa.toFixed(1)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          <Card title="➕ Przychody inne (niestandardowe)">
            <ExtraRevenueTable rows={month.przychody_inne} onChange={(rows) => patch({ przychody_inne: rows })} />
          </Card>

          <Card title="🏢 Koszty stałe miesiąca">
            <CostTable rows={month.koszty_stale} onChange={(rows) => patch({ koszty_stale: rows })} addLabel="Dodaj koszt stały" />
          </Card>

          <Card title="📦 Koszty pozostałe">
            <CostTable rows={month.koszty_pozostale} onChange={(rows) => patch({ koszty_pozostale: rows })} addLabel="Dodaj koszt pozostały" />
          </Card>
        </div>

        <aside data-pdf-aside className="xl:sticky xl:top-6">
          <MonthSummaryCard ym={ym} s={s} />
        </aside>
      </div>
    </div>
  )
}
