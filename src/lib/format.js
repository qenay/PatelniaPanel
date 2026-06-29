// Polskie formatowanie liczb i dat

const NBSP = ' ' // twarda spacja — nie pozwala "zł" przejść do nowej linii

export function formatPLN(value) {
  const n = Number(value) || 0
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + NBSP + 'zł'
}

export function formatNum(value, decimals = 0) {
  const n = Number(value) || 0
  return n.toLocaleString('pl-PL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatPLNdec(value, decimals = 2) {
  const n = Number(value) || 0
  return n.toLocaleString('pl-PL', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + NBSP + 'zł'
}

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]
const MONTHS_SHORT = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru']

// "2026-06" -> "Czerwiec 2026"
export function monthLabel(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_PL[m - 1]} ${y}`
}
export function monthLabelShort(ym) {
  if (!ym) return ''
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS_SHORT[m - 1]} ${y}`
}

// ISO date "2026-06-12" -> "12.06.2026"
export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

// ISO date -> "2026-06"
export function ymOf(iso) {
  if (!iso) return ''
  return iso.slice(0, 7)
}

export function num(v) {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

export function cls(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function profitClass(value) {
  return value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-slate-500'
}
