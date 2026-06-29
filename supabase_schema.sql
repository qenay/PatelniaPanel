-- ============================================================
-- Panel Managera Imprez — schemat bazy Supabase
-- Wklej całość w Supabase: SQL Editor → New query → Run
-- ============================================================

-- Wydarzenia (cała struktura wydarzenia trzymana w JSON)
create table if not exists public.events (
  id uuid primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- Miesiące (koszty stałe / pozostałe / przychody inne)
create table if not exists public.months (
  miesiac text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- RLS — dostęp dla klucza anonimowego (panel chroniony wspólnym hasłem w aplikacji)
alter table public.events enable row level security;
alter table public.months enable row level security;

drop policy if exists "anon_all_events" on public.events;
create policy "anon_all_events" on public.events for all using (true) with check (true);

drop policy if exists "anon_all_months" on public.months;
create policy "anon_all_months" on public.months for all using (true) with check (true);

-- Realtime — żeby zmiany były widoczne u wszystkich na żywo
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.months;
