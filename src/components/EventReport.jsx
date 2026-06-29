import { forwardRef } from 'react'
import { eventMetrics, ticketRows, revenueTotals, rowRevenue, kosztKwota } from '../lib/calc.js'
import { formatPLN, formatNum, formatDate, cls, profitClass } from '../lib/format.js'

/* Czysty, jednokolumnowy layout rozliczenia jednej imprezy — do zrzutu PDF. */
const EventReport = forwardRef(function EventReport({ ev }, ref) {
  const m = eventMetrics(ev)
  const rev = revenueTotals(ev)
  const tickets = ticketRows(ev)
  const koszty = (ev.koszty || []).filter((k) => kosztKwota(k) > 0)
  const premie = (ev.premie || []).filter((p) => Number(p.kwota) > 0)

  return (
    <div ref={ref} data-pdf-root style={{ width: 900 }} className="bg-white p-10 text-slate-800 font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b-4 border-navy pb-4 mb-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-gold-dk font-bold">Panel Managera · Plaża Patelnia</div>
          <h1 className="text-3xl font-display font-extrabold text-navy mt-1">Rozliczenie imprezy</h1>
          <div className="text-lg font-semibold mt-1">{ev.nazwa || 'Bez nazwy'}</div>
          <div className="text-slate-500">{formatDate(ev.data)}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-slate-400">Zysk / strata</div>
          <div className={cls('text-3xl font-display font-extrabold tabular-nums', m.zysk >= 0 ? 'text-emerald-600' : 'text-rose-600')}>{formatPLN(m.zysk)}</div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <Kpi label="Łączna liczba gości" value={`${formatNum(m.guests)} os.`} />
        <Kpi label="Przychód całkowity" value={formatPLN(m.przychod)} />
        <Kpi label="Koszty imprezy" value={formatPLN(m.kosztyImprezy)} />
        <Kpi label="Średnia ogólna" value={`${m.srOgolna.toFixed(2)} zł/os`} />
        <Kpi label="Średnia barowa" value={`${m.srBarowa.toFixed(2)} zł/os`} />
        <Kpi label="Przychód z barów" value={formatPLN(m.przychodBary)} />
      </div>

      {ev.opis ? <p className="text-sm text-slate-500 mb-6 italic">„{ev.opis}"</p> : null}

      {/* Bilety */}
      <Section title="Bilety">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-200">
            <th className="py-1.5">Typ</th><th className="py-1.5 text-right">Ilość</th><th className="py-1.5 text-right">Cena</th><th className="py-1.5 text-right">Łącznie</th>
          </tr></thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.key} className="border-b border-slate-100">
                <td className="py-1.5">{t.label}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNum(t.ilosc)}</td>
                <td className="py-1.5 text-right tabular-nums text-slate-500">{t.cena} zł</td>
                <td className="py-1.5 text-right tabular-nums">{formatPLN(t.suma)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="font-bold border-t-2 border-slate-300">
            <td className="py-2">Razem</td><td className="py-2 text-right tabular-nums">{formatNum(m.guests)} os.</td><td></td>
            <td className="py-2 text-right tabular-nums">{formatPLN(m.ticketRevenue)}</td>
          </tr></tfoot>
        </table>
      </Section>

      {/* Przychody */}
      <Section title="Przychody">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400 border-b border-slate-200">
            <th className="py-1.5">Pozycja</th><th className="py-1.5 text-right">Gotówka</th><th className="py-1.5 text-right">Terminal</th>
            <th className="py-1.5 text-right">SuperBoss</th><th className="py-1.5 text-right">PayU</th><th className="py-1.5 text-right">Suma</th>
          </tr></thead>
          <tbody>
            {(ev.przychody || []).map((r) => (
              <tr key={r.id} className="border-b border-slate-100">
                <td className="py-1.5">{r.bar ? <span className="text-[10px] font-bold text-gold-dk mr-1">BAR</span> : null}{r.nazwa}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNum(r.gotowka)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNum(r.terminal)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNum(r.superboss)}</td>
                <td className="py-1.5 text-right tabular-nums">{formatNum(r.payu)}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold">{formatPLN(rowRevenue(r))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
            <Row label="Bary razem" value={rev.bary} />
            <Row label="Wszystko razem" value={rev.suma} bold />
          </div>
          <div className="rounded-lg bg-navy text-white p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-300">Gotówka</span><span className="tabular-nums">{formatPLN(rev.gotowka)}</span></div>
            <div className="flex justify-between"><span className="text-slate-300">Terminal</span><span className="tabular-nums">{formatPLN(rev.terminal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-300">Przelewy / PayU</span><span className="tabular-nums">{formatPLN(rev.przelewy)}</span></div>
            <div className="flex justify-between border-t border-white/15 mt-1 pt-1 font-bold"><span>Suma</span><span className="tabular-nums text-gold">{formatPLN(rev.suma)}</span></div>
          </div>
        </div>
      </Section>

      {/* Koszty */}
      <Section title="Koszty imprezy">
        <table className="w-full text-sm">
          <tbody>
            {koszty.map((k) => (
              <tr key={k.id} className="border-b border-slate-100">
                <td className="py-1.5">{k.nazwa}{k.stawka != null ? <span className="text-slate-400"> ({formatNum(k.osoby)} × {formatNum(k.stawka)} zł)</span> : null}</td>
                <td className="py-1.5 text-right">
                  <span className={cls('text-xs font-semibold mr-3', k.zaplacono ? 'text-emerald-600' : 'text-amber-600')}>{k.zaplacono ? 'zapłacono' : 'do zapłaty'}</span>
                </td>
                <td className="py-1.5 text-right tabular-nums w-28">{formatPLN(kosztKwota(k))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="font-bold border-t-2 border-slate-300">
            <td className="py-2" colSpan={2}>Razem koszty</td><td className="py-2 text-right tabular-nums">{formatPLN(m.koszty)}</td>
          </tr></tfoot>
        </table>
      </Section>

      {/* Premie */}
      {premie.length > 0 && (
        <Section title="Premie pracownicze">
          <table className="w-full text-sm">
            <tbody>
              {premie.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-1.5">{p.pracownik || '—'}</td>
                  <td className="py-1.5 text-right tabular-nums w-28">{formatPLN(p.kwota)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-bold border-t-2 border-slate-300">
              <td className="py-2">Razem premie</td><td className="py-2 text-right tabular-nums">{formatPLN(m.premie)}</td>
            </tr></tfoot>
          </table>
        </Section>
      )}

      {/* Bilans końcowy */}
      <div className="mt-7 rounded-xl bg-navy text-white p-5">
        <div className="flex justify-between text-sm py-1"><span className="text-slate-300">Przychód całkowity</span><span className="tabular-nums">{formatPLN(m.przychod)}</span></div>
        <div className="flex justify-between text-sm py-1"><span className="text-slate-300">Koszty imprezy (koszty + premie)</span><span className="tabular-nums">− {formatPLN(m.kosztyImprezy)}</span></div>
        <div className="flex justify-between items-baseline border-t-2 border-white/20 mt-2 pt-2">
          <span className="font-display font-bold text-lg">ZYSK / STRATA</span>
          <span className={cls('text-2xl font-display font-extrabold tabular-nums', m.zysk >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{formatPLN(m.zysk)}</span>
        </div>
      </div>

      <div className="text-[11px] text-slate-400 mt-5 text-center">
        Wygenerowano {new Date().toLocaleString('pl-PL')} · Panel Managera Imprez — Plaża Patelnia
      </div>
    </div>
  )
})

function Kpi({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-lg font-display font-bold text-navy tabular-nums mt-0.5">{value}</div>
    </div>
  )
}
function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h2 className="font-display font-bold text-navy border-l-4 border-gold pl-2 mb-2">{title}</h2>
      {children}
    </div>
  )
}
function Row({ label, value, bold }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={cls('tabular-nums', bold ? 'font-bold text-navy' : '')}>{formatPLN(value)}</span>
    </div>
  )
}

export default EventReport
