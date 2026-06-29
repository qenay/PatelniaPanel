import { cls, profitClass, formatPLN } from '../lib/format.js'

export function NumInput({ value, onChange, className = '', step = 'any', min, placeholder = '0', suffix }) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={value === 0 ? '' : value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
        className={cls('input-num', suffix ? 'pr-8' : '', className)}
      />
      {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>}
    </div>
  )
}

export function TextInput({ value, onChange, placeholder = '', className = '' }) {
  return (
    <input
      type="text"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={cls('input', className)}
    />
  )
}

export function DateInput({ value, onChange, className = '' }) {
  return <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} className={cls('input', className)} />
}

export function Select({ value, onChange, options, className = '' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cls('input bg-white', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export function Money({ value, color = false, className = '' }) {
  return <span className={cls('tabular-nums', color ? profitClass(value) : '', className)}>{formatPLN(value)}</span>
}

export function Card({ title, icon, right, children, className = '' }) {
  return (
    <section className={cls('card p-5', className)}>
      {(title || right) && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-navy flex items-center gap-2">{icon}{title}</h3>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function IconBtn({ onClick, title, children, danger = false }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cls(
        'inline-grid place-items-center w-8 h-8 rounded-lg transition-colors',
        danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-500 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="py-12 text-center text-slate-400">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-slate-100 grid place-items-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      </div>
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cls('relative w-11 h-6 rounded-full transition-colors', checked ? 'bg-emerald-500' : 'bg-slate-300')}
      role="switch"
      aria-checked={checked}
    >
      <span className={cls('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : '')} />
    </button>
  )
}

export const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
)
export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
)
export const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
)
