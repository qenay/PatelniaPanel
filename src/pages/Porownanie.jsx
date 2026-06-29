import { useState, useMemo, useRef } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { db } from '../lib/db.js'
import { monthSummary } from '../lib/calc.js'
import { formatPLN, formatNum, monthLabel, monthLabelShort, cls } from '../lib/format.js'
import { Card, EmptyState } from '../components/ui.jsx'
import { genMonths } from '../components/MonthPicker.jsx'
import { PageHead } from './Wydarzenia.jsx'
import { elementToPDF } from '../lib/pdf.js'

const MAX = 6

const METRICS = [
  { key: 'liczbaImprez', label: 'Liczba imprez', better: 'max', fmt: (v) => formatNum(v) },
  { key: 'guests', label: 'Łączna liczba gości', better: 'max', fmt: (v) => formatNum(v) },
  { key: 'srGoscie', label: 'Śr. goście / imprezę', better: 'max', fmt: (v) => formatNum(Math.round(v)) },
  { key: 'przychodyLacznie', label: 'Łączne przychody', better: 'max', fmt: formatPLN },
  { key: 'kosztyImprez', label: 'Koszty imprez', better: 'min', fmt: formatPLN },
  { key: 'kosztyStale', label: 'Koszty stałe', better: 'min', fmt: formatPLN },
  { key: 'kosztyPozostale', label: 'Koszty pozostałe', better: 'min', fmt: formatPLN },
  { key: 'kosztyLacznie', label: 'Łączne koszty', better: 'min', fmt: formatPLN },
  { key: 'bary', label: 'Bar razem', better: 'max', fmt: formatPLN },
  { key: 'srBarowa', label: 'Śr. barowa / gość', better: 'max', fmt: (v) => v.toFixed(1) + ' zł' },
  { key: 'srOgolna', label: 'Śr. ogólna / gość', better: 'max', fmt: (v) => v.toFixed(1) + ' zł' },
  { key: 'zysk', label: 'Zysk', better: 'max', fmt: formatPLN },
  { key: 'marza', label: 'Marża %', better: 'max', fmt: (v) => v.toFixed(1) + '%' },
]

export default function Porownanie() {
  const monthsAvail = useMemo(() => {
    const set = new Set([...genMonths(18, 2), ...db.availableMonths()])
    return [...set].sort().reverse()
  }, [])
  const [selected, setSelected] = useState(() => monthsAvail.slice(0, 3))
  const reportRef = useRef(null)

  function toggle(ym) {
    setSelected((cur) => {
      if (cur.includes(ym)) return cur.filter((m) => m !== ym)
      if (cur.length >= MAX) return cur
      return [...cur, ym].sort()
    })
  }

  const data = [...selected].sort().map((ym) => {
    const s = monthSummary(db.eventsOfMonth(ym), db.getMonth(ym))
    return { ym, label: monthLabelShort(ym), srGoscie: s.liczbaImprez > 0 ? s.guests / s.liczbaImprez : 0, ...s }
  })

  return (
    <div>
      <PageHead
        title="Porównanie miesięcy"
        subtitle={`Wybierz do ${MAX} miesięcy do porównania.`}
        action={data.length > 0 && <button className="btn-navy" onClick={() => elementToPDF(reportRef.current, 'Porownanie_miesiecy.pdf')}>📄 PDF</button>}
      />

      {/* wybór miesięcy */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {monthsAvail.map((ym) => {
            const on = selected.includes(ym)
            return (
              <button key={ym} onClick={() => toggle(ym)}
                className={cls('px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                  on ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:border-navy')}>
                {monthLabel(ym)}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">Zaznaczono {selected.length}/{MAX}.</p>
      </Card>

      {data.length === 0 ? (
        <Card><EmptyState>Wybierz przynajmniej jeden miesiąc.</EmptyState></Card>
      ) : (
        <div className="space-y-6" ref={reportRef} data-pdf-root>
          {/* Tabela porównawcza */}
          <Card title="📋 Tabela porównawcza">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="th">Wskaźnik</th>
                    {data.map((d) => <th key={d.ym} className="th text-right">{monthLabel(d.ym)}</th>)}
                    <th className="th text-center">Najlepszy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {METRICS.map((mt) => {
                    const vals = data.map((d) => d[mt.key] || 0)
                    const bestVal = mt.better === 'max' ? Math.max(...vals) : Math.min(...vals)
                    const bestIdx = vals.indexOf(bestVal)
                    return (
                      <tr key={mt.key} className="hover:bg-slate-50">
                        <td className="td font-medium text-slate-700">{mt.label}</td>
                        {data.map((d, i) => {
                          const v = d[mt.key] || 0
                          const prev = i > 0 ? (data[i - 1][mt.key] || 0) : null
                          return (
                            <td key={d.ym} className={cls('td text-right tabular-nums', i === bestIdx && 'font-bold text-navy')}>
                              {mt.fmt(v)}
                              {prev != null && prev !== v && <Delta cur={v} prev={prev} better={mt.better} />}
                            </td>
                          )
                        })}
                        <td className="td text-center">🥇 {monthLabelShort(data[bestIdx].ym)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Wykres słupkowy */}
          <Card title="📊 Przychód · Koszty · Zysk">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatNum(v)} width={70} />
                  <Tooltip formatter={(v) => formatPLN(v)} />
                  <Legend />
                  <Bar dataKey="przychodyLacznie" name="Przychód" fill="#F5C842" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="kosztyLacznie" name="Koszty" fill="#f43f5e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="zysk" name="Zysk" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Wykres liniowy */}
          <Card title="📈 Trend średnich (ogólna / barowa)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v.toFixed(0)} width={50} />
                  <Tooltip formatter={(v) => v.toFixed(2) + ' zł/os'} />
                  <Legend />
                  <Line type="monotone" dataKey="srOgolna" name="Śr. ogólna" stroke="#0D2240" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
                  <Line type="monotone" dataKey="srBarowa" name="Śr. barowa" stroke="#e0b32f" strokeWidth={2.5} dot={{ r: 4 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Delta({ cur, prev, better }) {
  const diff = cur - prev
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0
  const up = diff > 0
  const good = better === 'max' ? up : !up
  return (
    <span className={cls('block text-[11px] font-semibold', good ? 'text-emerald-600' : 'text-rose-600')}>
      {up ? '↑' : '↓'} {Math.abs(pct).toFixed(0)}%
    </span>
  )
}
