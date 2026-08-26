# SIH Platform — Frontend

Frontend base for a Smart India Hackathon project. It is intentionally
**domain-agnostic**: the plumbing every SIH build needs (auth, routing, an API
service layer, ML-result screens, loading/empty/error states) is finished, while
the problem-specific fields and copy are marked as placeholders for you to fill
in once the problem statement is fixed.

It runs today against a built-in mock backend, so you can demo the full flow
before the backend or ML service exists.

## Stack

| Concern       | Choice                     | Why                                            |
| ------------- | -------------------------- | ---------------------------------------------- |
| Build tool    | Vite 8                     | Near-instant dev server and fast builds        |
| UI            | React 19 + TypeScript      | Types catch backend contract drift early       |
| Styling       | Tailwind CSS v4            | No context switching, consistent spacing       |
| Routing       | React Router 7             | Nested layouts and route guards                |
| Validation    | Zod 4                      | One schema for both TS types and runtime checks |
| Charts        | Recharts                   | Responsive charts with little setup            |
| Icons         | lucide-react               | Consistent, tree-shakeable icon set            |

## Quick start

```bash
npm install
cp .env.example .env.local   # PowerShell: copy .env.example .env.local
npm run dev
```

Open http://localhost:5173. The app starts in **demo mode**, so sign in with any
valid email address and any password of 6 or more characters.

### Scripts

| Command           | Purpose                                     |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                  |
| `npm run build`   | Typecheck and build to `dist/`              |
| `npm run preview` | Serve the production build locally          |
| `npm run lint`    | Lint the codebase                           |

## Project structure

```text
src/
├── auth/            Auth context, provider, and the useAuth hook
├── components/
│   ├── feedback/    Loading, empty, error, and alert views + ErrorBoundary
│   ├── layout/      App shell (sidebar, top bar) and page header
│   ├── ml/          Risk badge, confidence meter, prediction result card
│   └── ui/          Button, Card, Badge, Spinner, form fields
├── config/          Validated environment configuration
├── hooks/           useApiQuery, useApiMutation, useTheme
├── lib/             Class-name merging and formatting helpers
├── pages/           One file per route
├── routes/          Route guards
└── services/        API layer — the ONLY place that talks to the backend
    ├── apiClient.ts       fetch wrapper: auth, timeout, error normalisation
    ├── apiError.ts        ApiError type and user-facing messages
    ├── contracts.ts       Zod schemas = types + runtime validation
    ├── authService.ts     Auth endpoints
    ├── predictionService.ts  Prediction and dashboard endpoints
    └── mock/              Demo backend, used only when the mock flag is on
```

### The one architectural rule

Components never call `fetch`. They call a hook, which calls a service, which
calls the API client:

```text
Page/Component → useApiQuery / useApiMutation → service → apiClient → Backend → ML
```

This keeps the entire backend integration inside `src/services/`, so a contract
change touches one folder instead of every screen.

## Connecting the real backend

1. Give `docs/API_CONTRACT.md` to your backend developer and have them correct it.
2. Update `src/services/contracts.ts` so the Zod schemas match the agreed shapes.
3. In `.env.local`, set:

```ini
VITE_USE_MOCK_API="false"
VITE_DEV_PROXY_TARGET="http://localhost:8000"   # your backend, avoids CORS
```

4. Restart `npm run dev` — Vite only reads env files at startup.

If a response does not match the schema, the UI shows a clear error and logs the
exact mismatch to the browser console. That is deliberate: it surfaces contract
drift while you are integrating rather than during the demo.

## Environment variables

| Variable                | Default        | Purpose                                          |
| ----------------------- | -------------- | ------------------------------------------------ |
| `VITE_APP_NAME`         | `SIH Platform` | Product name in the sidebar and login screen     |
| `VITE_API_BASE_URL`     | `/api`         | Where API calls go                               |
| `VITE_USE_MOCK_API`     | `true`         | `true` uses demo data; **must be `false` for submission** |
| `VITE_API_TIMEOUT_MS`   | `20000`        | Request timeout                                  |
| `VITE_DEV_PROXY_TARGET` | empty          | Dev-only proxy target that avoids CORS setup     |

Everything prefixed with `VITE_` is embedded into the JavaScript bundle and is
publicly readable. **Never put secrets here.**

## About the ML integration

The frontend performs no inference. It validates input, posts it, and renders
whatever the backend returns from the ML service. Results are presented for a
non-technical audience: a plain-language risk badge, confidence as a percentage
with a sentence explaining how much to trust it, a recommended action, and a
breakdown of contributing factors.

Every result card carries a footer stating that the output is decision support
and not a final judgement, alongside the model version for traceability.

**No fake predictions ship in the real build.** The mock data in
`src/services/mock/` is reachable only when `VITE_USE_MOCK_API=true`.

> **There is no on-screen indicator that demo mode is active.** Confirm
> `VITE_USE_MOCK_API="false"` in `.env.local` before your final submission, or
> the app will present mock output as if it were real model results. The only
> way to tell demo mode apart from the real thing is to read the env file.

## What is still a placeholder

These are deliberately generic and should be replaced once the problem statement
is confirmed. Each is marked in code with `PLACEHOLDER`:

- **Assessment form fields** (`src/pages/AssessPage.tsx`) — generic stand-ins
  awaiting the model's real input schema.
- **API routes and payloads** (`src/services/contracts.ts`) — assumptions, not an
  agreed contract.
- **User roles** — currently `admin`, `analyst`, `field_officer`.
- **Product name and copy** — set via `VITE_APP_NAME` and page headers.
- **Colour palette** (`src/index.css`) — retheme by editing the tokens only.

## Accessibility and responsiveness

Built in from the start, because retrofitting them the night before a demo never
works:

- Keyboard navigable with a visible focus ring and a skip-to-content link.
- Form errors linked to inputs via `aria-describedby` and announced with `role="alert"`.
- Loading and result regions use `aria-live` so screen readers announce updates.
- Mobile-first: the sidebar collapses to a drawer and history switches from a
  table to stacked cards on small screens.
- Light and dark themes, honouring the system preference on first visit.
- Respects `prefers-reduced-motion`.

## Testing

No test setup is included yet, to keep the initial dependency footprint small.
If you add one, Vitest plus React Testing Library fits this stack with no extra
configuration. The highest-value things to cover first:

- `src/services/apiClient.ts` — error normalisation for each status code.
- `src/services/contracts.ts` — schemas accept real backend payloads.
- Form validation in `AssessPage` and `LoginPage`.

Until then, verify manually against this checklist:

- [ ] Sign in with an invalid email — inline field error, no request sent
- [ ] Sign in successfully — redirected to the dashboard
- [ ] Refresh on `/history` — stays signed in, no flash of the login page
- [ ] Submit an assessment — loading state, then the result card
- [ ] Set `VITE_USE_MOCK_API=false` with no backend — a clear network error, not a blank screen
- [ ] Resize to 375 px wide — sidebar becomes a drawer, no horizontal scroll
- [ ] Tab through every page — focus always visible
- [ ] Toggle dark mode — all text stays readable
