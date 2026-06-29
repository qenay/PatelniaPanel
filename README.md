# Panel Managera Imprez — Plaża Patelnia

Aplikacja webowa (SPA) dla managera klubu/venue. Zastępuje Excel.
Dane trzymane lokalnie w **localStorage** (warstwa danych odizolowana — łatwa podmiana na Supabase).

## Stack
React 18 + Vite · Tailwind CSS · React Router · Recharts (wykresy) · SheetJS/xlsx (eksport) · date-fns · uuid

## Uruchomienie
```bash
npm install
npm run dev
# → http://localhost:5173
```
Build produkcyjny: `npm run build`, podgląd: `npm run preview`.

> Pierwsze wejście: na zakładce **Wydarzenia** (pusta) jest przycisk **„Wczytaj dane przykładowe"** — wczytuje demo, żeby zobaczyć panel w akcji. Usuwasz dane czyszcząc localStorage.

## Moduły
- **Wydarzenia** — lista imprez (sortowana, filtr po miesiącu, SUMA) + formularz wydarzenia: informacje, bilety, przychody (stacje/bary, podział gotówka/terminal/przelewy), koszty imprezy (checkbox „zapłacono", Ochrona = osoby × 350 zł), premie. Po prawej **panel na żywo** (zysk, średnia ogólna i barowa) + **„Pobierz rozliczenie (PDF)"** — czysty raport-kwit jednej imprezy dla właściciela (bilety, przychody, koszty, bilans).
- **Miesiąc** — imprezy miesiąca, przychody inne, koszty stałe i pozostałe, sticky **podsumowanie miesiąca** + **eksport do Excel** (.xlsx, kwoty z groszami, format `#,##0.00`) i **eksport do PDF** (zrzut widoku — raport-obraz, zachowuje polskie znaki).
- **Porównanie miesięcy** — do 6 miesięcy: tabela wskaźników z kolumną „Najlepszy" 🥇 i zmianą % (↑/↓), wykres słupkowy (przychód/koszty/zysk) i liniowy (średnie).
- **Koszty miesięczne** — koszty stałe/pozostałe wybranego miesiąca + sumy + status „zapłacono".
- **Do zapłaty** — zbiorcze zobowiązania miesiąca: niezapłacone koszty imprez i koszty miesięczne, suma „razem do zapłaty", oznaczanie pozycji jako zapłacone (pojedynczo lub zbiorczo).
- **Bilety** — karty wydarzeń ze szczegółami sprzedaży + filtr + eksport do Excel/PDF.

## Kopia zapasowa danych
W sidebarze (na dole): **Pobierz** zapisuje całość danych do pliku JSON, **Wczytaj** przywraca je z pliku (zastępuje obecne). Zalecane regularnie — dane żyją w localStorage przeglądarki.

## Model danych
Patrz `src/lib/db.js` — fabryki `newEvent()` / `newMonth()` oraz API `db.*`.
Struktura zgodna ze specyfikacją (wydarzenie: bilety/przychody/koszty/premie; miesiąc: koszty_stałe/pozostałe/przychody_inne).

## Migracja na Supabase
Cała komunikacja z magazynem jest w **`src/lib/db.js`** (funkcje `read`/`write` + API `db`).
Aby przejść na Supabase: zamień ciała `read`/`write` na zapytania do Supabase (async) i dostosuj hooki w `src/hooks/useStorage.js`. Reszta aplikacji nie wymaga zmian.

## Założenia obliczeniowe (do ewentualnej korekty)
- **Raport fiskalny** w tabeli przychodów to pole **kontrolne** (odczyt kasy) — NIE wlicza się do sumy (żeby nie dublować gotówki/terminala).
- **Koszty imprezy** w zysku = suma kosztów + premie.
- Zniżki/inne reguły można dołożyć w `src/lib/calc.js` (wszystkie wyliczenia są tam scentralizowane).
