# Juve Tracker

Web app Next.js + TypeScript + Tailwind per monitorare Juventus: rosa, partite (live/passate/prossime), notifiche push e news RSS.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres (cache + persistenza)
- football-data.org API v4
- Web Push (`web-push`)

## Setup locale
1. Installa dipendenze:
```bash
npm install
```
2. Crea `.env` da `.env.example`.
3. Se usi Supabase, applica la migration:
- File SQL: `supabase/migration.sql`
- Esegui in SQL Editor Supabase.
4. Avvio:
```bash
npm run dev
```

## ENV
Vedi `.env.example`.
Chiavi principali:
- `FOOTBALL_DATA_API_KEY`
- `JUVE_TEAM_ID` (default 109)
- `TIMEZONE=Europe/Rome`
- `CRON_SECRET`
- VAPID keys per push
- Supabase URL + Service Role key
- `USE_MOCK_DATA=true` per sviluppare senza API esterne

## Endpoint API
- `GET /api/juve/squad`
- `GET /api/juve/matches?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/juve/live`
- `GET /api/admin/verify-team`
- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/cron/daily`
- `POST /api/cron/matchday`

## Cron Vercel
File `vercel.json`:
- `daily`: `0 8 * * *` (08:00 UTC, allineato circa alle 09:00 Europe/Rome; in DST puo cambiare di 1h)
- `matchday`: ogni 10 minuti

Per invocare route protette usa header:
- `x-cron-secret: <CRON_SECRET>`

## Verifica team Juventus
Chiama:
```bash
GET /api/admin/verify-team
```
Controlla che `name` contenga `Juventus`; se no correggi `JUVE_TEAM_ID`.

## Push notifications
1. Genera VAPID keys:
```bash
npx web-push generate-vapid-keys
```
2. Inserisci valori in `.env`.
3. Vai su `/settings/notifications` e clicca "Attiva notifiche".

## Mock mode
Con `USE_MOCK_DATA=true` i dati arrivano da:
- `mocks/players.json`
- `mocks/matches.json`

## Deploy Vercel
1. Push repo su GitHub.
2. Importa progetto su Vercel.
3. Configura tutte le ENV in Vercel Project Settings.
4. Deploy.
5. Configura dominio pubblico Vercel.

## Troubleshooting rate limits football-data
- Client con retry/backoff su `429/403/5xx`
- Logging di status, request-id e headers utili
- Caching DB via tabella `cache_meta`
- Refresh intensivo solo in matchday/live

