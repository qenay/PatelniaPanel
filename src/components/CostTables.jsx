import { v4 as uuid } from 'uuid'
import { formatPLN, num, cls } from '../lib/format.js'
import { NumInput, IconBtn, PlusIcon, TrashIcon, EmptyState } from './ui.jsx'

const FORMA = [
  { value: 'przelew', label: 'przelew' },
  { value: 'gotowka', label: 'gotówka' },
  { value: 'blik', label: 'BLIK' },
]

export function CostTable({ rows, onChange, addLabel = 'Dodaj koszt' }) {
  const upd = (id, patch) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const del = (id) => onChange(rows.filter((r) => r.id !== id))
  const add = () => onChange([...rows, { id: uuid(), nazwa: '', forma: 'przelew', data: '', kwota: 0, zaplacono: false }])
  const sum = rows.reduce((s, r) => s + num(r.kwota), 0)
  const unpaid = rows.reduce((s, r) => s + (r.zaplacono ? 0 : num(r.kwota)), 0)

  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState>Brak pozycji.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead><tr>
              <th className="th">Nazwa</th><th className="th w-36">Forma płatności</th>
              <th className="th w-36">Data</th><th className="th text-right w-28">Kwota</th>
              <th className="th w-32 text-center">Status</th><th className="th w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td"><input className="input py-1.5" value={r.nazwa} placeholder="Nazwa" onChange={(e) => upd(r.id, { nazwa: e.target.value })} /></td>
                  <td className="td">
                    <select className="input py-1.5 bg-white" value={r.forma} onChange={(e) => upd(r.id, { forma: e.target.value })}>
                      {FORMA.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </td>
                  <td className="td"><input type="date" className="input py-1.5" value={r.data || ''} onChange={(e) => upd(r.id, { data: e.target.value })} /></td>
                  <td className="td"><NumInput value={r.kwota} onChange={(v) => upd(r.id, { kwota: v })} suffix="zł" /></td>
                  <td className="td text-center">
                    <button onClick={() => upd(r.id, { zaplacono: !r.zaplacono })}
                      className={cls('pill gap-1 whitespace-nowrap', r.zaplacono ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>
                      {r.zaplacono ? '✓ zapłacono' : '✗ do zapłaty'}
                    </button>
                  </td>
                  <td className="td"><IconBtn danger title="Usuń" onClick={() => del(r.id)}><TrashIcon /></IconBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <button className="btn-ghost btn-sm" onClick={add}><PlusIcon /> {addLabel}</button>
        <div className="text-sm flex items-center gap-4">
          {unpaid > 0 && <span className="text-amber-600">Do zapłaty: <b className="tabular-nums">{formatPLN(unpaid)}</b></span>}
          <span><span className="text-slate-500">Suma: </span><span className="font-bold tabular-nums">{formatPLN(sum)}</span></span>
        </div>
      </div>
    </div>
  )
}

export function ExtraRevenueTable({ rows, onChange }) {
  const upd = (id, patch) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const del = (id) => onChange(rows.filter((r) => r.id !== id))
  const add = () => onChange([...rows, { id: uuid(), data: '', nazwa: '', wartosc: 0 }])
  const sum = rows.reduce((s, r) => s + num(r.wartosc), 0)

  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState>Brak innych przychodów.</EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead><tr>
              <th className="th w-40">Data</th><th className="th">Nazwa / opis</th><th className="th text-right w-32">Wartość</th><th className="th w-10"></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td"><input type="date" className="input py-1.5" value={r.data || ''} onChange={(e) => upd(r.id, { data: e.target.value })} /></td>
                  <td className="td"><input className="input py-1.5" value={r.nazwa} placeholder="np. wynajem sali" onChange={(e) => upd(r.id, { nazwa: e.target.value })} /></td>
                  <td className="td"><NumInput value={r.wartosc} onChange={(v) => upd(r.id, { wartosc: v })} suffix="zł" /></td>
                  <td className="td"><IconBtn danger title="Usuń" onClick={() => del(r.id)}><TrashIcon /></IconBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <button className="btn-ghost btn-sm" onClick={add}><PlusIcon /> Dodaj przychód</button>
        <div className="text-sm"><span className="text-slate-500">Suma: </span><span className="font-bold tabular-nums">{formatPLN(sum)}</span></div>
      </div>
    </div>
  )
}
