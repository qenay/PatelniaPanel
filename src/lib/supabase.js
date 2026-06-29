import { createClient } from '@supabase/supabase-js'

// URL i klucz publishable są publiczne (lądują w przeglądarce) — można je trzymać w kodzie.
// Można nadpisać zmiennymi środowiskowymi (Vercel → Environment Variables).
const url = import.meta.env.VITE_SUPABASE_URL || 'https://htcrleqelgkosxetvbcf.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rtWHswMe6ueuuhuO2GEVwA_KA62S7hd'

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 5 } },
})
