import { useState } from 'react'

// Wspólne hasło dostępu. W produkcji ustawiane przez zmienną środowiskową
// VITE_PANEL_PASSWORD (w Vercel: Settings → Environment Variables).
const PANEL_PW = import.meta.env.VITE_PANEL_PASSWORD || 'patelnia2026'

export default function Login({ onOk }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pw === PANEL_PW) {
      localStorage.setItem('panel.auth', 'ok')
      onOk()
    } else {
      setErr(true)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gold grid place-items-center text-navy mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
          </div>
          <h1 className="font-display font-extrabold text-navy text-xl">Panel Managera</h1>
          <p className="text-slate-400 text-sm">Imprezy · Plaża Patelnia</p>
        </div>

        <label className="label">Hasło dostępu</label>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(false) }}
          placeholder="Wpisz wspólne hasło"
          className={`input ${err ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-200' : ''}`}
        />
        {err && <p className="text-rose-500 text-sm mt-2">Nieprawidłowe hasło.</p>}

        <button type="submit" className="btn-gold w-full mt-5">Wejdź do panelu</button>
        <p className="text-[11px] text-slate-400 text-center mt-4">Dostęp tylko dla zespołu.</p>
      </form>
    </div>
  )
}
