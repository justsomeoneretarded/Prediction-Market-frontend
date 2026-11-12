# Tinbit web — notes for AI assistants

Architecture, API and invariants are documented in the backend repo (`../prediction-market-backend/CLAUDE.md`,
`docs/ARCHITECTURE.md`, `docs/graph/CODEMAP.md` — the code map covers this repo too).

- API client with CSRF header: `src/lib/api.ts`; session hook: `src/lib/session.tsx`
- Realtime (socket events → SWR revalidation; DB stays authoritative): `src/lib/realtime.tsx`
- i18n dictionary (en/am): `src/lib/i18n.tsx` — add both languages for every new key
- Trade UX: `src/components/trade-panel.tsx` (debounced quote → idempotency key per intended trade)
- Admin: `src/app/admin/page.tsx`, `src/app/admin/markets/[id]/page.tsx`
- Never compute money client-side for anything that is submitted; the API quote is the source of truth.
- E2E: `pnpm e2e` (needs running, seeded stack). Use `:visible` locators — the market page renders the trade panel twice (mobile + desktop).
