import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'
import { db, newEvent } from '../lib/db.js'
import { eventMetrics, ticketRows, rowRevenue, revenueTotals } from '../lib/calc.js'
import { formatPLN, formatNum, num, cls, profitClass } from '../lib/format.js'
import { Card, NumInput, TextInput, Money, IconBtn, Toggle, PlusIcon, TrashIcon } from '../components/ui.jsx'
import { PageHead } from './Wydarzenia.jsx'
import EventReport from '../components/EventReport.jsx'
import { elementToPDF } from '../lib/pdf.js'

export default function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ev, setEv] = useState(() => (id ? db.getEvent(id) || newEvent() : newEvent()))
  const reportRef = useRef(null)
  const fileName = `Rozliczenie_${(ev.nazwa || 'impreza').replace(/[^\w]+/g, '_')}_${ev.data}.pdf`

  const m = eventMetrics(ev)
  const rev = revenueTotals(ev)

  const set = (patch) => setEv((e) => ({ ...e, ...patch }))
  const setBilet = (g, k, v) => setEv((e) => ({ ...e, bilety: { ...e.bilety, [g]: { ...e.bilety[g], [k]: v } } }))
  const setRow = (list, idv, patch) => setEv((e) => ({ ...e, [list]: e[list].map((r) => (r.id === idv ? { ...r, ...patch } : r)) }))
  const delRow = (list, idv) => setEv((e) => ({ ...e, [list]: e[list].filter((r) => r.id !== idv) }))
  const addRow = (list, item) => setEv((e) => ({ ...e, [list]: [...e[list], item] }))

  function save() {
    if (!ev.nazwa.trim()) { alert('Podaj nazwę wydarzenia.'); return }
    db.saveEvent(ev)
    navigate('/wydarzenia')
  }

  const tickets = ticketRows(ev)

  return (
    <div>
      <PageHead title={id ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'} subtitle="Wszystkie wyliczenia aktualizują się na żywo." />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {/* Informacje ogólne */}
          <Card title="Informacje ogólne">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nazwa wydarzenia</label>
                <TextInput value={ev.nazwa} onChange={(v) => set({ nazwa: v })} placeholder="np. Dyskoteka jak za dawnych lat" />
              </div>
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={ev.data} onChange={(e) => set({ data: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Opis / notatki</label>
                <textarea className="input min-h-[72px] resize-y" value={ev.opis} onChange={(e) => set({ opis: e.target.value })} placeholder="Dodatkowe informacje…" />
              </div>
            </div>
          </Card>

          {/* Bilety */}
          <Card title="🎟️ Bilety">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead><tr>
                  <th className="th">Typ</th><th className="th text-right">Ilość</th>
                  <th className="th text-right">Cena jedn.</th><th className="th text-right">Łącznie</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  <BiletRow label="Online" r={tickets[0]} onIlosc={(v) => setBilet('online', 'ilosc', v)} onCena={(v) => setBilet('online', 'cena', v)} />
                  <BiletRow label="Sprzedaż (kasa)" r={tickets[1]} onIlosc={(v) => setBilet('sprzedaz', 'ilosc', v)} onCena={(v) => setBilet('sprzedaz', 'cena', v)} />
                  <BiletRow label="Osoby za darmo do 23:00" r={tickets[2]} onIlosc={(v) => setBilet('darmowe_do23', 'ilosc', v)} free />
                  <BiletRow label="Darmowe" r={tickets[3]} onIlosc={(v) => setBilet('darmowe', 'ilosc', v)} free />
                </tbody>
                <tfoot className="border-t-2 border-slate-200 font-semibold">
                  <tr>
                    <td className="td">Łącznie</td>
                    <td className="td text-right tabular-nums">{formatNum(m.guests)} os.</td>
                    <td className="td"></td>
                    <td className="td text-right tabular-nums">{formatPLN(m.ticketRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Przychody */}
          <Card title="💵 Przychody" right={<button className="btn-ghost btn-sm" onClick={() => addRow('przychody', { id: uuid(), nazwa: 'Nowa pozycja', bar: true, gotowka: 0, terminal: 0, raport_fiskalny: 0, superboss: 0, payu: 0 })}><PlusIcon /> Dodaj pozycję</button>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead><tr>
                  <th className="th">Pozycja</th>
                  <th className="th text-right">Gotówka</th><th className="th text-right">Terminal</th>
                  <th className="th text-right" title="Pole kontrolne — nie wlicza się do sumy">Raport fisk.*</th>
                  <th className="th text-right">SuperBoss</th><th className="th text-right">PayU</th>
                  <th className="th text-right">Suma</th><th className="th"></th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {ev.przychody.map((r) => (
                    <tr key={r.id}>
                      <td className="td min-w-[160px]">
                        <div className="flex items-center gap-2">
                          <button title={r.bar ? 'Pozycja barowa' : 'Oznacz jako bar'} onClick={() => setRow('przychody', r.id, { bar: !r.bar })}
                            className={cls('text-[10px] font-bold px-1.5 py-0.5 rounded', r.bar ? 'bg-gold text-navy' : 'bg-slate-100 text-slate-400')}>BAR</button>
                          <input className="input py-1.5" value={r.nazwa} onChange={(e) => setRow('przychody', r.id, { nazwa: e.target.value })} />
                        </div>
                      </td>
                      <td className="td w-24"><NumInput value={r.gotowka} onChange={(v) => setRow('przychody', r.id, { gotowka: v })} /></td>
                      <td className="td w-24"><NumInput value={r.terminal} onChange={(v) => setRow('przychody', r.id, { terminal: v })} /></td>
                      <td className="td w-24"><NumInput value={r.raport_fiskalny} onChange={(v) => setRow('przychody', r.id, { raport_fiskalny: v })} /></td>
                      <td className="td w-24"><NumInput value={r.superboss} onChange={(v) => setRow('przychody', r.id, { superboss: v })} /></td>
                      <td className="td w-24"><NumInput value={r.payu} onChange={(v) => setRow('przychody', r.id, { payu: v })} /></td>
                      <td className="td text-right tabular-nums font-semibold whitespace-nowrap">{formatPLN(rowRevenue(r))}</td>
                      <td className="td"><IconBtn danger title="Usuń" onClick={() => delRow('przychody', r.id)}><TrashIcon /></IconBtn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">* Raport fiskalny to pole kontrolne (odczyt kasy) — nie wlicza się do sumy przychodu.</p>

            {/* podsumowanie przychodów */}
            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-slate-50 p-4 space-y-2 text-sm">
                <Line label="Bary razem" value={rev.bary} />
                <Line label="Wszystko razem" value={rev.suma} bold />
              </div>
              <div className="rounded-lg bg-navy text-white p-4">
                <div className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-wide text-slate-300 mb-1">
                  <span>Gotówka</span><span>Terminal</span><span>Przelewy/PayU</span><span className="text-right">Suma</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm font-semibold tabular-nums">
                  <span>{formatNum(rev.gotowka)}</span><span>{formatNum(rev.terminal)}</span><span>{formatNum(rev.przelewy)}</span><span className="text-right text-gold">{formatNum(rev.suma)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-300">Koszt (gotówkowy)</span>
                  <div className="w-32"><NumInput value={ev.kosztGotowkowy} onChange={(v) => set({ kosztGotowkowy: v })} suffix="zł" /></div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-slate-300">Gotówka po kosztach</span>
                  <span className={cls('font-bold tabular-nums', m.gotowkaPoKosztach < 0 ? 'text-rose-300' : 'text-emerald-300')}>{formatPLN(m.gotowkaPoKosztach)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Koszty imprezy */}
          <Card title="🧾 Koszty imprezy" right={<button className="btn-ghost btn-sm" onClick={() => addRow('koszty', { id: uuid(), nazwa: '', kwota: 0, zaplacono: false })}><PlusIcon /> Dodaj koszt</button>}>
            <div className="space-y-2">
              {ev.koszty.map((k) => {
                const isOchrona = k.stawka != null
                const kwota = isOchrona ? num(k.osoby) * num(k.stawka) : num(k.kwota)
                return (
                  <div key={k.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
                    <input className="input py-1.5 flex-1 min-w-[160px]" value={k.nazwa} placeholder="Nazwa kosztu" onChange={(e) => setRow('koszty', k.id, { nazwa: e.target.value })} />
                    {isOchrona && (
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <div className="w-16"><NumInput value={k.osoby} onChange={(v) => setRow('koszty', k.id, { osoby: v, kwota: num(v) * num(k.stawka) })} placeholder="os." /></div>
                        <span>×</span>
                        <div className="w-20"><NumInput value={k.stawka} onChange={(v) => setRow('koszty', k.id, { stawka: v, kwota: num(k.osoby) * num(v) })} suffix="zł" /></div>
                        <span>=</span>
                      </div>
                    )}
                    {!isOchrona && <div className="w-28"><NumInput value={k.kwota} onChange={(v) => setRow('koszty', k.id, { kwota: v })} suffix="zł" /></div>}
                    {isOchrona && <span className="w-24 text-right font-semibold tabular-nums">{formatPLN(kwota)}</span>}
                    <button onClick={() => setRow('koszty', k.id, { zaplacono: !k.zaplacono })}
                      className={cls('pill gap-1', k.zaplacono ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {k.zaplacono ? '✓ zapłacono' : '✗ do zapłaty'}
                    </button>
                    <IconBtn danger title="Usuń" onClick={() => delRow('koszty', k.id)}><TrashIcon /></IconBtn>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 text-right text-sm">
              <span className="text-slate-500">Razem koszty: </span>
              <span className="font-bold tabular-nums">{formatPLN(m.koszty)}</span>
            </div>
          </Card>

          {/* Premie */}
          <Card title="🎁 Premie pracownicze" right={<button className="btn-ghost btn-sm" onClick={() => addRow('premie', { id: uuid(), pracownik: '', kwota: 0 })}><PlusIcon /> Dodaj premię</button>}>
            {ev.premie.length === 0 ? (
              <p className="text-sm text-slate-400">Brak premii.</p>
            ) : (
              <div className="space-y-2">
                {ev.premie.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <input className="input py-1.5 flex-1" value={p.pracownik} placeholder="Pracownik" onChange={(e) => setRow('premie', p.id, { pracownik: e.target.value })} />
                    <div className="w-32"><NumInput value={p.kwota} onChange={(v) => setRow('premie', p.id, { kwota: v })} suffix="zł" /></div>
                    <IconBtn danger title="Usuń" onClick={() => delRow('premie', p.id)}><TrashIcon /></IconBtn>
                  </div>
                ))}
                <div className="text-right text-sm pt-1"><span className="text-slate-500">Razem premie: </span><span className="font-bold tabular-nums">{formatPLN(m.premie)}</span></div>
              </div>
            )}
          </Card>
        </div>

        {/* Live summary */}
        <aside className="xl:sticky xl:top-6 space-y-4">
          <div className="card-dark p-5">
            <h3 className="font-display font-bold flex items-center gap-2 mb-4">📊 Podsumowanie na żywo</h3>
            <Stat label="Łączna liczba gości" value={`${formatNum(m.guests)} os.`} />
            <Stat label="Przychód całkowity" value={formatPLN(m.przychod)} />
            <Stat label="Koszty imprezy" value={formatPLN(m.kosztyImprezy)} muted />
            <div className="my-3 border-t border-white/15" />
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Zysk / strata</span>
              <span className={cls('text-2xl font-display font-extrabold tabular-nums', m.zysk > 0 ? 'text-emerald-400' : m.zysk < 0 ? 'text-rose-400' : 'text-white')}>{formatPLN(m.zysk)}</span>
            </div>
            <div className="my-3 border-t border-white/15" />
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400">Średnia ogólna (przychód ÷ goście)</div>
                <div className="text-lg font-bold text-gold tabular-nums">{m.srOgolna.toFixed(2)} zł/os</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Średnia barowa (bary ÷ goście)</div>
                <div className="text-lg font-bold text-gold tabular-nums">{m.srBarowa.toFixed(2)} zł/os</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-gold flex-1" onClick={save}>Zapisz wydarzenie</button>
            <button className="btn-ghost" onClick={() => navigate('/wydarzenia')}>Anuluj</button>
          </div>
          <button className="btn-navy w-full" onClick={() => elementToPDF(reportRef.current, fileName)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            Pobierz rozliczenie (PDF)
          </button>
        </aside>
      </div>

      {/* Raport poza ekranem — źródło do PDF */}
      <div style={{ position: 'absolute', left: -99999, top: 0, width: 900 }} aria-hidden="true">
        <EventReport ref={reportRef} ev={ev} />
      </div>
    </div>
  )
}

function BiletRow({ label, r, onIlosc, onCena, free }) {
  return (
    <tr>
      <td className="td">{label}</td>
      <td className="td w-28"><NumInput value={r.ilosc} onChange={onIlosc} /></td>
      <td className="td w-28">{free ? <span className="block text-right text-slate-400 text-sm pr-1">0 zł</span> : <NumInput value={r.cena} onChange={onCena} suffix="zł" />}</td>
      <td className="td text-right tabular-nums font-medium">{formatPLN(r.suma)}</td>
    </tr>
  )
}

function Line({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cls('tabular-nums', bold ? 'font-bold text-navy' : '')}>{formatPLN(value)}</span>
    </div>
  )
}

function Stat({ label, value, muted }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-slate-300 text-sm">{label}</span>
      <span className={cls('tabular-nums font-semibold', muted ? 'text-slate-300' : 'text-white')}>{value}</span>
    </div>
  )
}
