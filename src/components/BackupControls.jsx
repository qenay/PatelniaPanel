import { useRef } from 'react'
import { db } from '../lib/db.js'

export default function BackupControls() {
  const fileRef = useRef(null)

  function download() {
    const data = db.exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panel-kopia-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function onFile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        const n = Array.isArray(data.events) ? data.events.length : 0
        if (confirm(`Wczytać kopię (${n} wydarzeń)?\nObecne dane zostaną ZASTĄPIONE.`)) {
          db.importAll(data)
          alert('Kopia wczytana pomyślnie.')
        }
      } catch (err) {
        alert('Nie udało się wczytać pliku: ' + err.message)
      }
      e.target.value = ''
    }
    reader.readAsText(f)
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-2">Kopia zapasowa</div>
      <div className="flex gap-2">
        <button onClick={download} title="Pobierz kopię danych (JSON)"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg py-2 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Pobierz
        </button>
        <button onClick={() => fileRef.current?.click()} title="Wczytaj kopię z pliku"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg py-2 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          Wczytaj
        </button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
    </div>
  )
}
