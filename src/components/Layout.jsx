import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cls } from '../lib/format.js'
import BackupControls from './BackupControls.jsx'

const NAV = [
  { to: '/wydarzenia', label: 'Wydarzenia', icon: '📋' },
  { to: '/miesiac', label: 'Miesiąc', icon: '📅' },
  { to: '/porownanie', label: 'Porównanie miesięcy', icon: '📊' },
  { to: '/koszty', label: 'Koszty miesięczne', icon: '💰' },
  { to: '/zobowiazania', label: 'Do zapłaty', icon: '💸' },
  { to: '/bilety', label: 'Bilety', icon: '🎟️' },
]

function SidebarLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cls(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-gold text-navy font-semibold' : 'text-slate-300 hover:bg-white/10 hover:text-white',
            )
          }
        >
          <span className="text-base leading-none">{n.icon}</span>
          {n.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const current = NAV.find((n) => loc.pathname.startsWith(n.to))

  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-navy flex-col py-5 sticky top-0 h-screen">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto">
          <SidebarLinks />
        </div>
        <div className="px-5 pt-4 border-t border-white/10">
          <BackupControls />
          <div className="text-[11px] text-slate-500 mt-3">Dane lokalne (localStorage) · v1.0</div>
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-navy py-5 flex flex-col animate-[slideIn_.25s_ease]">
            <Brand />
            <div className="mt-6 flex-1 overflow-y-auto"><SidebarLinks onNavigate={() => setOpen(false)} /></div>
            <div className="px-5 pt-4 border-t border-white/10"><BackupControls /></div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-navy text-white flex items-center gap-3 px-4 h-14">
          <button onClick={() => setOpen(true)} className="p-2 -ml-2" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          <span className="font-display font-bold">{current?.label || 'Panel Managera'}</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="px-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gold grid place-items-center text-navy">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      </div>
      <div className="leading-tight">
        <div className="text-white font-display font-extrabold">Panel Managera</div>
        <div className="text-[11px] text-gold tracking-wide uppercase">Imprezy · Plaża Patelnia</div>
      </div>
    </div>
  )
}
