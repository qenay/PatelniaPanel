import { formatPLN, monthLabel, cls } from '../lib/format.js'

function Row({ label, value, strong, color }) {
  return (
    <div className={cls('flex items-center justify-between py-1.5', strong ? 'font-bold' : '')}>
      <span className={strong ? 'text-white' : 'text-slate-300'}>{label}</span>
      <span className={cls('tabular-nums', color || (strong ? 'text-white' : 'text-slate-100'))}>{formatPLN(value)}</span>
    </div>
  )
}

export default function MonthSummaryCard({ ym, s }) {
  return (
    <div className="card-dark p-5">
      <h3 className="font-display font-bold flex items-center gap-2 mb-4">📊 Podsumowanie — {monthLabel(ym)}</h3>

      <div className="text-sm">
        <Row label="Przychody z imprez" value={s.przychodyImprez} />
        <Row label="Przychody inne" value={s.przychodyInne} />
        <div className="border-t border-white/15 my-1" />
        <Row label="ŁĄCZNE PRZYCHODY" value={s.przychodyLacznie} strong color="text-gold" />
      </div>

      <div className="text-sm mt-4">
        <Row label="Koszty stałe" value={s.kosztyStale} />
        <Row label="Koszty pozostałe" value={s.kosztyPozostale} />
        <Row label="Koszty imprez" value={s.kosztyImprez} />
        <div className="border-t border-white/15 my-1" />
        <Row label="ŁĄCZNE KOSZTY" value={s.kosztyLacznie} strong />
      </div>

      <div className="mt-4 pt-4 border-t-2 border-white/20">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold">ZYSK MIESIĄCA</span>
          <span className={cls('text-2xl font-display font-extrabold tabular-nums', s.zysk > 0 ? 'text-emerald-400' : s.zysk < 0 ? 'text-rose-400' : 'text-white')}>{formatPLN(s.zysk)}</span>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm">
          <span className="text-slate-300">Gotówka po kosztach</span>
          <span className={cls('tabular-nums font-semibold', s.gotowkaPoKosztach < 0 ? 'text-rose-300' : 'text-emerald-300')}>{formatPLN(s.gotowkaPoKosztach)}</span>
        </div>
        <div className="flex items-center justify-between mt-1 text-sm">
          <span className="text-slate-300">Marża</span>
          <span className="tabular-nums font-semibold text-slate-100">{s.marza.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}
