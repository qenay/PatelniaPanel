import { useState, useEffect } from 'react'
import { db } from '../lib/db.js'
import { useEventsOfMonth } from '../hooks/useStorage.js'
import { monthFixedTotal, monthOtherTotal, monthSummary } from '../lib/calc.js'
import { formatPLN, monthLabel } from '../lib/format.js'
import { Card } from '../components/ui.jsx'
import MonthPicker, { currentYM } from '../components/MonthPicker.jsx'
import { CostTable } from '../components/CostTables.jsx'
import { PageHead } from './Wydarzenia.jsx'

export default function KosztyMiesieczne() {
  const [ym, setYm] = useState(currentYM())
  const events = useEventsOfMonth(ym)
  const [month, setMonth] = useState(() => db.getMonth(ym))
  useEffect(() => { setMonth(db.getMonth(ym)) }, [ym])
  const patch = (p) => { const next = { ...month, ...p }; setMonth(next); db.saveMonth(next) }

  const stale = monthFixedTotal(month)
  const pozostale = monthOtherTotal(month)
  const s = monthSummary(events, month)

  return (
    <div>
      <PageHead
        title="Koszty miesięczne"
        subtitle="Koszty stałe i pozostałe w wybranym miesiącu."
        action={<MonthPicker value={ym} onChange={setYm} extra={db.availableMonths()} />}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Koszty stałe" value={stale} />
        <StatCard label="Koszty pozostałe" value={pozostale} />
        <StatCard label="Koszty imprez" value={s.kosztyImprez} />
        <StatCard label="ŁĄCZNE KOSZTY" value={s.kosztyLacznie} dark />
      </div>

      <div className="space-y-6">
        <Card title="🏢 Koszty stałe miesiąca">
          <CostTable rows={month.koszty_stale} onChange={(rows) => patch({ koszty_stale: rows })} addLabel="Dodaj koszt stały" />
        </Card>
        <Card title="📦 Koszty pozostałe">
          <CostTable rows={month.koszty_pozostale} onChange={(rows) => patch({ koszty_pozostale: rows })} addLabel="Dodaj koszt pozostały" />
        </Card>
      </div>
    </div>
  )
}

function StatCard({ label, value, dark }) {
  return (
    <div className={dark ? 'card-dark p-4' : 'card p-4'}>
      <div className={dark ? 'text-xs uppercase tracking-wide text-slate-300' : 'text-xs uppercase tracking-wide text-slate-500'}>{label}</div>
      <div className={dark ? 'text-2xl font-display font-extrabold text-gold tabular-nums mt-1' : 'text-2xl font-display font-extrabold text-navy tabular-nums mt-1'}>{formatPLN(value)}</div>
    </div>
  )
}
