import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/db.js'
import { useEventsOfMonth } from '../hooks/useStorage.js'
import { unpaidEventCosts, unpaidRows, kosztKwota } from '../lib/calc.js'
import { formatPLN, formatDate, monthLabel, num } from '../lib/format.js'
import { Card, EmptyState } from '../components/ui.jsx'
import MonthPicker, { currentYM } from '../components/MonthPicker.jsx'
import { PageHead } from './Wydarzenia.jsx'

export default function Zobowiazania() {
  const [ym, setYm] = useState(currentYM())
  const events = useEventsOfMonth(ym)
  const [month, setMonth] = useState(() => db.getMonth(ym))
  const navigate = useNavigate()
  useEffect(() => { setMonth(db.getMonth(ym)) }, [ym])
  const patchMonth = (p) => { const next = { ...month, ...p }; setMonth(next); db.saveMonth(next) }

  const evUnpaid = events.map((ev) => ({ ev, ...unpaidEventCosts(ev) })).filter((x) => x.sum > 0)
  const stale = unpaidRows(month.koszty_stale)
  const poz = unpaidRows(month.koszty_pozostale)
  const evSum = evUnpaid.reduce((s, x) => s + x.sum, 0)
  const total = evSum + stale.sum + poz.sum

  const payEventCost = (ev, id) => db.saveEvent({ ...ev, koszty: ev.koszty.map((k) => (k.id === id ? { ...k, zaplacono: true } : k)) })
  const payAllEvent = (ev) => db.saveEvent({ ...ev, koszty: ev.koszty.map((k) => ({ ...k, zaplacono: true })) })
  const payMonthRow = (list, id) => patchMonth({ [list]: month[list].map((r) => (r.id === id ? { ...r, zaplacono: true } : r)) })
  const payAllMonth = (list) => patchMonth({ [list]: month[list].map((r) => ({ ...r, zaplacono: true })) })

  const nothing = total === 0

  return (
    <div>
      <PageHead
        title="Do zapłaty"
        subtitle="Niezapłacone koszty imprez i kosztów miesięcznych."
        action={<MonthPicker value={ym} onChange={setYm} extra={db.availableMonths()} />}
      />

      {/* Suma */}
      <div className={`rounded-xl p-6 mb-6 flex flex-wrap items-center justify-between gap-3 ${nothing ? 'bg-emerald-600' : 'bg-navy'} text-white shadow-lg`}>
        <div>
          <div className="text-sm text-white/70 uppercase tracking-wide">Razem do zapłaty — {monthLabel(ym)}</div>
          <div className="text-3xl font-display font-extrabold mt-1">{formatPLN(total)}</div>
        </div>
        <div className="text-right text-sm text-white/80">
          <div>Koszty imprez: <b>{formatPLN(evSum)}</b></div>
          <div>Koszty stałe: <b>{formatPLN(stale.sum)}</b> · pozostałe: <b>{formatPLN(poz.sum)}</b></div>
        </div>
      </div>

      {nothing ? (
        <Card><EmptyState>🎉 Wszystko opłacone w tym miesiącu — brak zobowiązań.</EmptyState></Card>
      ) : (
        <div className="space-y-6">
          {/* Koszty imprez */}
          {evUnpaid.length > 0 && (
            <Card title="🎵 Niezapłacone koszty imprez">
              <div className="space-y-4">
                {evUnpaid.map(({ ev, items, sum }) => (
                  <div key={ev.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                      <button className="font-semibold text-navy hover:underline" onClick={() => navigate(`/wydarzenia/${ev.id}`)}>
                        {ev.nazwa || 'Bez nazwy'} <span className="text-slate-400 font-normal">· {formatDate(ev.data)}</span>
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="font-bold tabular-nums text-amber-600">{formatPLN(sum)}</span>
                        <button className="btn-ghost btn-sm" onClick={() => payAllEvent(ev)}>Oznacz wszystkie</button>
                      </div>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {items.map((k) => (
                        <li key={k.id} className="flex items-center justify-between gap-3 px-4 py-2">
                          <span className="text-sm">{k.nazwa || '—'}</span>
                          <div className="flex items-center gap-3">
                            <span className="tabular-nums text-sm">{formatPLN(kosztKwota(k))}</span>
                            <button className="pill bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => payEventCost(ev, k.id)}>Zapłacono ✓</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Koszty miesięczne */}
          {stale.sum > 0 && (
            <Card title="🏢 Niezapłacone koszty stałe" right={<button className="btn-ghost btn-sm" onClick={() => payAllMonth('koszty_stale')}>Oznacz wszystkie</button>}>
              <UnpaidList items={stale.items} onPay={(id) => payMonthRow('koszty_stale', id)} />
            </Card>
          )}
          {poz.sum > 0 && (
            <Card title="📦 Niezapłacone koszty pozostałe" right={<button className="btn-ghost btn-sm" onClick={() => payAllMonth('koszty_pozostale')}>Oznacz wszystkie</button>}>
              <UnpaidList items={poz.items} onPay={(id) => payMonthRow('koszty_pozostale', id)} />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function UnpaidList({ items, onPay }) {
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
          <div>
            <span className="text-sm font-medium">{r.nazwa || '—'}</span>
            <span className="text-xs text-slate-400 ml-2">{r.forma}{r.data ? ` · ${formatDate(r.data)}` : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums text-sm">{formatPLN(num(r.kwota))}</span>
            <button className="pill bg-emerald-50 text-emerald-700 hover:bg-emerald-100" onClick={() => onPay(r.id)}>Zapłacono ✓</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
