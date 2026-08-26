# API Contract

> **STATUS: PLACEHOLDER — CONFIRM WITH BACKEND DEVELOPER**
>
> Nothing in this document has been agreed with the backend team. Every endpoint,
> payload, and status code below is an assumption the frontend made so the UI
> could be built before the backend existed.
>
> **Backend developer: please review this file and correct anything that is
> wrong.** The frontend will be updated to match whatever you confirm.

## How to use this document

1. Backend dev reviews each endpoint and edits the tables to match reality.
2. Frontend dev updates `src/services/contracts.ts` to match the corrected tables.
3. Set `VITE_USE_MOCK_API=false` in `.env.local` and integrate against the real API.

The Zod schemas in `src/services/contracts.ts` validate every response at
runtime. If the backend returns a different shape, the UI shows a clear
"unexpected response format" error and logs the exact mismatch to the browser
console — so contract drift is caught immediately rather than at the demo.

## Conventions assumed

| Item             | Assumption                                                    |
| ---------------- | ------------------------------------------------------------- |
| Base URL         | `VITE_API_BASE_URL` (defaults to `/api` via the dev proxy)     |
| Content type     | `application/json` for requests and responses                  |
| Authentication   | `Authorization: Bearer <token>` header on all protected routes |
| Success envelope | Resource returned at the top level, **not** wrapped in `data`  |
| Error envelope   | `{ "message": string, "errors"?: { field: string } }`          |
| Timestamps       | ISO 8601 strings in UTC                                        |
| Confidence       | Float `0.0`–`1.0`, **not** a percentage                        |

**Open question for backend:** do you wrap responses in an envelope such as
`{ "success": true, "data": {...} }`? The frontend currently assumes you do not.

---

## 1. Login

| Item              | Details                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| Endpoint          | `/auth/login`                                                              |
| Method            | `POST`                                                                     |
| Authentication    | None                                                                       |
| Request           | `{ "email": string, "password": string }`                                  |
| Response `200`    | `{ "token": string, "user": { "id", "name", "email", "role" } }`           |
| Errors            | `401` invalid credentials · `422` validation errors · `500` server error    |
| Frontend handling | Button shows "Signing in…" and is disabled; `422` field errors render under the matching inputs; other errors show a red alert above the form |

`role` must be one of `admin`, `analyst`, `field_officer`.

**Open questions:** token lifetime? Is there a refresh token? Should the token be
an httpOnly cookie instead of a JSON field (preferred for security)?

---

## 2. Current user

| Item              | Details                                                            |
| ----------------- | ------------------------------------------------------------------ |
| Endpoint          | `/auth/me`                                                         |
| Method            | `GET`                                                              |
| Authentication    | Bearer token required                                              |
| Request           | None                                                               |
| Response `200`    | `{ "id", "name", "email", "role" }`                                |
| Errors            | `401` token missing/expired                                        |
| Frontend handling | Called once on app start to restore a session after a page refresh. On `401` the stored token is cleared and the user is sent to `/login` |

---

## 3. Logout

| Item              | Details                                                        |
| ----------------- | -------------------------------------------------------------- |
| Endpoint          | `/auth/logout`                                                 |
| Method            | `POST`                                                         |
| Authentication    | Bearer token required                                          |
| Request           | None                                                           |
| Response          | `204 No Content`                                               |
| Errors            | Any                                                            |
| Frontend handling | The local session is cleared regardless of the response, so sign-out always works even if the server is unreachable |

---

## 4. Create assessment (ML prediction)

This is the only endpoint that touches the ML model. **The frontend runs no
inference of any kind** — it validates input, posts it, and renders the response.

| Item              | Details                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| Endpoint          | `/predictions`                                                             |
| Method            | `POST`                                                                     |
| Authentication    | Bearer token required                                                      |
| Request           | `{ "subjectLabel": string, "features": { ... } }`                          |
| Response `200`    | A `PredictionResult` (see below)                                           |
| Errors            | `422` invalid input · `401` · `500` · `503` model unavailable              |
| Frontend handling | Submit button shows "Analysing…"; result renders in a card beside the form; errors show inline without clearing the user's input |

### `PredictionResult`

| Field            | Type                                             | Notes                                        |
| ---------------- | ------------------------------------------------ | -------------------------------------------- |
| `id`             | string                                           | Unique assessment id                         |
| `subjectLabel`   | string                                           | Echoed back for display                      |
| `riskLevel`      | `low` \| `moderate` \| `high` \| `critical`      | Drives the coloured badge                    |
| `confidence`     | number `0.0`–`1.0`                               | **Not** a percentage; the UI formats it      |
| `summary`        | string                                           | One or two plain-language sentences          |
| `recommendation` | string                                           | The action a user should take                |
| `factors`        | array                                            | Explainability; may be empty                 |
| `modelVersion`   | string                                           | Shown in the result footer for traceability  |
| `createdAt`      | ISO 8601 string                                  |                                              |

Each entry in `factors`:

| Field          | Type                            | Notes                                     |
| -------------- | ------------------------------- | ----------------------------------------- |
| `label`        | string                          | Human-readable feature name               |
| `contribution` | number `0.0`–`1.0`              | Share of the decision weight; sizes the bar |
| `direction`    | `increases` \| `decreases`      | Effect on risk                            |

**Open questions for Backend + ML:**

- What is the exact `features` schema the model expects? The current form fields
  are placeholders and will be rewritten once the problem statement is fixed.
- Is inference synchronous? If it takes more than ~20 s we need a job id plus a
  polling or websocket endpoint instead, and the frontend timeout must be raised.
- Can the model return `factors`? Without them the result card still renders, but
  we lose the explainability section, which is a strong scoring point at SIH.

---

## 5. Assessment history

| Item              | Details                                                                |
| ----------------- | ---------------------------------------------------------------------- |
| Endpoint          | `/predictions?page={number}&pageSize={number}`                         |
| Method            | `GET`                                                                  |
| Authentication    | Bearer token required                                                  |
| Request           | Query parameters only; `page` is zero-based                            |
| Response `200`    | `{ "items": PredictionResult[], "page", "pageSize", "total" }`         |
| Errors            | `401` · `500`                                                          |
| Frontend handling | Skeleton rows while loading; empty state with a call to action when `items` is empty; retry button on error |

**Open questions:** is `page` zero-based or one-based? Can filtering by risk level
be done server-side (`?riskLevel=high`)? It is currently done in the browser.

---

## 6. Dashboard summary

| Item              | Details                                                    |
| ----------------- | ---------------------------------------------------------- |
| Endpoint          | `/dashboard/summary`                                       |
| Method            | `GET`                                                      |
| Authentication    | Bearer token required                                      |
| Request           | None                                                       |
| Response `200`    | See fields below                                           |
| Errors            | `401` · `500`                                              |
| Frontend handling | Skeletons while loading; full-card error state with retry  |

| Field               | Type                                              |
| ------------------- | ------------------------------------------------- |
| `totalAssessments`  | number                                            |
| `highRiskCount`     | number                                            |
| `averageConfidence` | number `0.0`–`1.0`                                |
| `modelVersion`      | string                                            |
| `riskDistribution`  | `[{ "level": RiskLevel, "count": number }]`       |
| `trend`             | `[{ "date": "YYYY-MM-DD", "assessments", "highRisk" }]` |

---

## Error handling reference

Every failure is normalised into an `ApiError` (`src/services/apiError.ts`) so
the UI never branches on raw HTTP details.

| Backend condition   | `ApiError.kind` | What the user sees                                        |
| ------------------- | --------------- | --------------------------------------------------------- |
| Unreachable server  | `network`       | "Cannot reach the server. Check your internet connection." |
| No response in 20 s | `timeout`       | "The server took too long to respond."                     |
| `401`               | `unauthorized`  | Session cleared, redirected to login                       |
| `403`               | `forbidden`     | "You do not have permission to view this."                 |
| `404`               | `not_found`     | "We could not find what you were looking for."             |
| `400` / `422`       | `validation`    | Field-level errors under the relevant inputs               |
| `5xx`               | `server`        | "Something went wrong on the server." with a retry button   |
| Shape mismatch      | `contract`      | "Unexpected data format" plus a console log of the diff     |

## CORS

During local development, set `VITE_DEV_PROXY_TARGET` in `.env.local` to the
backend URL (for example `http://localhost:8000`). Requests then go through the
Vite dev server on a single origin and **no CORS configuration is needed**.

For a deployed frontend, the backend must send
`Access-Control-Allow-Origin` for the deployed domain and allow the
`Authorization` and `Content-Type` headers.
