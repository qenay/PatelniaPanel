import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEvents } from '../hooks/useStorage.js'
import { db } from '../lib/db.js'
import { eventMetrics } from '../lib/calc.js'
import { formatDate, formatPLN, formatNum, ymOf, monthLabel, cls, profitClass } from '../lib/format.js'
import { Money, EmptyState, IconBtn, PlusIcon, EditIcon, TrashIcon } from '../components/ui.jsx'

export default function Wydarzenia() {
  const events = useEvents()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const months = useMemo(() => {
    const set = new Set(events.map((e) => ymOf(e.data)).filter(Boolean))
    return [...set].sort().reverse()
  }, [events])

  const filtered = filter === 'all' ? events : events.filter((e) => ymOf(e.data) === filter)

  function remove(ev) {
    if (confirm(`Usunąć wydarzenie „${ev.nazwa || 'bez nazwy'}"?`)) db.deleteEvent(ev.id)
  }

  return (
    <div>
      <PageHead
        title="Wydarzenia"
        subtitle="Wszystkie imprezy — od najnowszej."
        action={
          <button className="btn-gold" onClick={() => navigate('/wydarzenia/nowe')}>
            <PlusIcon /> Nowe wydarzenie
          </button>
        }
      />

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">Filtruj po miesiącu:</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input bg-white w-auto">
          <option value="all">Wszystkie miesiące</option>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-auto">{filtered.length} wydarzeń</span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Data</th>
                <th className="th">Nazwa</th>
                <th className="th text-right">Goście</th>
                <th className="th text-right">Przychód</th>
                <th className="th text-right">Koszty</th>
                <th className="th text-right">Zysk</th>
                <th className="th text-right">Śr. ogólna</th>
                <th className="th text-right">Śr. barowa</th>
                <th className="th text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((ev) => {
                const m = eventMetrics(ev)
                return (
                  <tr key={ev.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/wydarzenia/${ev.id}`)}>
                    <td className="td whitespace-nowrap text-slate-500">{formatDate(ev.data)}</td>
                    <td className="td font-semibold text-navy">{ev.nazwa || <span className="text-slate-400 font-normal">bez nazwy</span>}</td>
                    <td className="td text-right tabular-nums">{formatNum(m.guests)}</td>
                    <td className="td text-right tabular-nums">{formatPLN(m.przychod)}</td>
                    <td className="td text-right tabular-nums text-slate-500">{formatPLN(m.kosztyImprezy)}</td>
                    <td className={cls('td text-right tabular-nums font-semibold', profitClass(m.zysk))}>{formatPLN(m.zysk)}</td>
                    <td className="td text-right tabular-nums">{m.srOgolna.toFixed(1)} zł</td>
                    <td className="td text-right tabular-nums">{m.srBarowa.toFixed(1)} zł</td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <IconBtn title="Edytuj" onClick={() => navigate(`/wydarzenia/${ev.id}`)}><EditIcon /></IconBtn>
                        <IconBtn title="Usuń" danger onClick={() => remove(ev)}><TrashIcon /></IconBtn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && <SummaryFoot rows={filtered} />}
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState>
            <p>Brak wydarzeń{filter !== 'all' ? ' w tym miesiącu' : ''}.</p>
            {events.length === 0 && (
              <button className="btn-ghost btn-sm mt-4" onClick={() => db.seedDemo()}>Wczytaj dane przykładowe</button>
            )}
          </EmptyState>
        )}
      </div>
    </div>
  )
}

function SummaryFoot({ rows }) {
  const tot = rows.reduce(
    (a, ev) => {
      const m = eventMetrics(ev)
      a.guests += m.guests; a.przychod += m.przychod; a.koszty += m.kosztyImprezy; a.zysk += m.zysk
      return a
    },
    { guests: 0, przychod: 0, koszty: 0, zysk: 0 },
  )
  return (
    <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
      <tr>
        <td className="td" colSpan={2}>SUMA</td>
        <td className="td text-right tabular-nums">{formatNum(tot.guests)}</td>
        <td className="td text-right tabular-nums">{formatPLN(tot.przychod)}</td>
        <td className="td text-right tabular-nums">{formatPLN(tot.koszty)}</td>
        <td className={cls('td text-right tabular-nums', profitClass(tot.zysk))}>{formatPLN(tot.zysk)}</td>
        <td className="td" colSpan={3}></td>
      </tr>
    </tfoot>
  )
}

export function PageHead({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-display font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
