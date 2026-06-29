import { monthLabel } from '../lib/format.js'

// generuje listę miesięcy od (teraz - back) do (teraz + fwd)
export function genMonths(back = 24, fwd = 6) {
  const now = new Date()
  const out = []
  for (let i = -back; i <= fwd; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out.reverse()
}

export function currentYM() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function MonthPicker({ value, onChange, extra = [] }) {
  const set = new Set([...genMonths(), ...extra, value].filter(Boolean))
  const months = [...set].sort().reverse()
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input bg-white w-auto font-semibold text-navy">
      {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
    </select>
  )
}
