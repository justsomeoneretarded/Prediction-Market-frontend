# Tinbit web · ትንቢት

Mobile-first web app for the Tinbit prediction market (virtual birr). Next.js 15 · React 19 ·
Tailwind v4 · SWR · Socket.IO. English and Amharic, light and dark mode.

API & architecture docs live in the backend repo:
[Prediction-Market-backend](https://github.com/justsomeoneretarded/Prediction-Market-backend) →
`docs/ARCHITECTURE.md`.

## Run

The easiest way is from the backend repo (`pnpm dev:all` starts everything). Standalone:

```bash
cp .env.example .env
```

```bash
pnpm install && pnpm dev
```

The app proxies `/api/*` and `/socket.io/*` to `API_URL` (default `http://localhost:4000`), so the browser
only ever talks to one origin — cookies stay first-party and CSRF stays simple. `API_URL` is read at
**build** time for production builds.

## Pages

| Route | |
|---|---|
| `/` | featured, trending, football, entertainment, most traded, closing soon, new |
| `/markets` | search, categories, sort, status filters |
| `/markets/[slug]` | chart (1D/1W/1M/All), trade panel with live preview, rules, sources, activity, liquidity, resolution & disputes, related |
| `/portfolio` | value, cash, P&L, positions, trade history, wallet (simulated deposit/withdraw), performance |
| `/admin` | overview, markets (create/publish/halt/close/cancel), risk, resolution queue, users, payments, sports, activity (trades/ledger/audit), system (health, reconciliation, demo clock) |
| `/how-it-works` | plain-language explainer with an interactive LMSR demo |
| `/login` `/register` `/settings` `/notifications` | |

## Tests

```bash
pnpm e2e
```

Runs against a running stack (seeded API + `pnpm build && pnpm start`). Covers the full acceptance flow:
admin creates a 50/50 market → A buys 1,000 YES → B buys 20 NO → holdings → admin risk view → close →
evidence → second-person approval → dispute window (simulated clock) → settlement → balances checked
against the LMSR maths; plus mobile navigation and Amharic rendering.

## Design system

Tokens in `src/app/globals.css` (`--brand`, `--yes`, `--no`, `--gold`, surfaces) with dark variants;
primitives in `src/components/ui/primitives.tsx`; no chart library (custom SVG in `components/chart.tsx`)
to keep the bundle small on mobile data.
