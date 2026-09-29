<div align="center">

# Subvia

### Multi-tenant subscription billing engine, with an admin workspace and a customer portal

Recurring billing, proration, a credit ledger, tax-aware invoicing and idempotent APIs, built on PostgreSQL transactions and row-level locking.

![Node](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma_7-4169E1?logo=postgresql&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest&logoColor=white)

</div>

---

## Table of contents

1. [Overview](#overview)
2. [Highlights](#highlights)
3. [Quick start](#quick-start)
4. [Architecture](#architecture)
5. [Domain model](#domain-model)
6. [Lifecycles and state machines](#lifecycles-and-state-machines)
7. [The billing engine](#the-billing-engine)
8. [Design decisions](#design-decisions)
9. [Payments](#payments)
10. [Security model](#security-model)
11. [Testing strategy](#testing-strategy)
12. [API reference](#api-reference)
13. [Frontend](#frontend)
14. [Demo data](#demo-data)
15. [Project structure](#project-structure)
16. [Extending Subvia](#extending-subvia)

---

## Overview

Subvia is a **multi-tenant SaaS billing platform**. A *business* (the tenant) publishes **services** and **pricing plans**. Its *customers* subscribe, get invoiced, pay, upgrade, downgrade and cancel. The engine handles the money math and the lifecycle transitions.

There are two account types, each with its own surface:

| Account | Surface | What they do |
|---|---|---|
| **ADMIN** (business operator) | Admin workspace | Manage services and plans, view customers, subscriptions, invoices, payments and a business-wide billing activity timeline. One admin can operate several businesses. |
| **CUSTOMER** | Customer portal | Browse a cross-business catalog, subscribe, pay invoices, change plans, cancel, and track credit and billing history. |

The interesting part is what happens underneath: **correctness under retries, concurrency and partial failure**, which is the hard part of any billing system.

---

## Highlights

| | |
|---|---|
| **Idempotent mutations** | Every state-changing billing call requires an `Idempotency-Key`. The idempotency record is written *inside the same DB transaction* as the business operation, so retries replay the stored response and a failed operation leaves no trace. Reusing a key with a different payload returns `409 IDEMPOTENCY_KEY_REUSED`. |
| **Concurrency-safe by construction** | Advisory locks stop double subscriptions. `SELECT … FOR UPDATE` serializes payments per invoice and renewals per subscription. Refresh-token rotation is a compare-and-swap. Each of these has a test that fires concurrent requests. |
| **Proration and credit ledger** | Mid-cycle upgrades are prorated to the millisecond. Immediate cancellations convert unused time into an **append-only credit ledger** that is auto-applied to future invoices, per currency. |
| **Full subscription lifecycle** | `PENDING → ACTIVE → PAST_DUE → CANCELLED`, plus scheduled downgrades, upgrade-on-payment, period-end cancellation and `PAST_DUE` recovery. |
| **Recurring billing worker** | A background worker plus a token-guarded internal endpoint renew due subscriptions. It is safe to run from several processes at once. |
| **Integer money everywhere** | Amounts are minor units (`paise`/`cents`) end-to-end. Tax is computed once and stored on the invoice. Currencies are never mixed. |
| **Strict tenant isolation** | Two layers of guards (account type, then business role), every query scoped by tenant, and dedicated isolation test suites. |
| **Integration-tested against real Postgres** | Tests drive the real HTTP stack against a real database, including race conditions, security boundaries and every lifecycle transition. |
| **Two polished UIs** | Separate admin and customer experiences with route guards, single-flight token refresh, printable invoices and a checkout with live invoice preview. |
| **Deterministic demo payments** | Payment outcomes are selectable (success or failure), so every failure path (declines, dunning, recovery, failed upgrades) is reproducible on demand. |

---

## Quick start

### Prerequisites

- Node.js `^22.12` (required by the toolchain: Prisma 7, Vitest 5, Vite 8)
- PostgreSQL 14+

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subvia"
JWT_SECRET="<at least 32 characters>"
INTERNAL_BILLING_SECRET="<at least 32 characters>"

# optional (defaults shown)
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS=7
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

```bash
npx prisma migrate deploy      # applies all migrations (incl. the invoice-number sequence)
npx prisma generate            # generates the client into src/generated/prisma
npm run dev                    # http://localhost:3000  ·  health: GET /api/v1/health
```

Secrets are validated at boot. The process **fails fast** if a secret is missing or shorter than 32 characters.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:3000/api/v1"
```

```bash
npm run dev                    # http://localhost:5173
```

### 3. Load realistic demo data (optional, recommended)

```bash
cd backend
npx tsx scripts/seed-demo.ts
```

Then sign in with the [demo credentials](#demo-data).

### 4. Run the tests

Create `backend/.env.test`:

```env
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subvia_test"
JWT_SECRET="<at least 32 characters>"
INTERNAL_BILLING_SECRET="<at least 32 characters>"
```

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/subvia_test" npx prisma migrate deploy
npm test
```

> The suite truncates the test database between tests. **Never point `TEST_DATABASE_URL` at a database you care about.**

---

## Architecture

```mermaid
flowchart LR
  subgraph SPA["React 19 SPA (Vite)"]
    ADM["Admin workspace"]
    CUS["Customer portal"]
    STATE["TanStack Query cache · Zustand auth store · Axios single-flight refresh"]
  end

  subgraph API["Express 5 API (TypeScript)"]
    direction TB
    MW["helmet · CORS · rate limiters · JWT auth · account-type guard · business-role guard"]
    CTRL["Controllers: Zod validation at the edge"]
    SVC["Domain services (transaction boundaries)"]
    ENG["Billing engine: proration · tax · credits · billing intervals"]
    IDEM["Idempotency layer"]
    ERR["Central error handler: stable error codes"]
    MW --> CTRL --> SVC
    SVC --> ENG
    SVC --> IDEM
    CTRL -.-> ERR
  end

  WORKER["Recurring billing worker (60s tick)"]
  INTERNAL["POST /internal/billing/run (X-Internal-Token)"]
  DB[("PostgreSQL · Prisma 7 + pg adapter")]

  ADM --> MW
  CUS --> MW
  SVC --> DB
  WORKER --> SVC
  INTERNAL --> SVC
```

### Request pipeline

```mermaid
flowchart LR
  A["Request"] --> B["authenticate<br/>(JWT)"]
  B --> C["requireAccountType<br/>ADMIN or CUSTOMER"]
  C --> D["requireBusinessRole<br/>membership + role"]
  D --> E["Zod parse<br/>params · query · body"]
  E --> F["Service<br/>prisma.$transaction"]
  F --> G["Uniform JSON envelope"]
```

Every response uses one envelope: `{ success: true, data, pagination? }` or `{ success: false, error: { code, message } }`. Error codes are **stable, machine-readable strings** (`ACTIVE_SUBSCRIPTION_EXISTS`, `INVOICE_ALREADY_PAID`, `IDEMPOTENCY_KEY_REUSED`, …), so clients branch on `code`, not on message text.

### Layering

Each backend feature is a module (`routes → controller → service → schema`). Controllers only parse and shape HTTP. **Services own transaction boundaries and business rules.** Cross-cutting concerns (idempotency, pagination, billing periods) live in `shared/`, and the money math lives in `modules/billing/`, free of HTTP and Prisma so it can be unit-tested directly.

---

## Domain model

```mermaid
erDiagram
  USER ||--o{ REFRESH_TOKEN : "rotates"
  USER ||--o{ BUSINESS_MEMBER : "administers"
  USER ||--o{ CUSTOMER_PROFILE : "subscribes as"
  BUSINESS ||--o{ BUSINESS_MEMBER : "has"
  BUSINESS ||--o{ CUSTOMER_PROFILE : "has"
  BUSINESS ||--o{ SERVICE : "offers"
  SERVICE ||--o{ PLAN : "priced by"
  CUSTOMER_PROFILE ||--o{ SUBSCRIPTION : "holds"
  PLAN ||--o{ SUBSCRIPTION : "current plan"
  PLAN |o--o{ SUBSCRIPTION : "pending plan"
  SUBSCRIPTION ||--o{ INVOICE : "bills"
  SUBSCRIPTION ||--o{ SUBSCRIPTION_EVENT : "audit trail"
  CUSTOMER_PROFILE ||--o{ INVOICE : "receives"
  INVOICE ||--|{ INVOICE_ITEM : "itemised by"
  INVOICE ||--o{ PAYMENT : "settled by"
  CUSTOMER_PROFILE ||--o{ CREDIT_LEDGER : "owns"
  INVOICE |o--o{ CREDIT_LEDGER : "consumes"

  USER {
    uuid id PK
    string email UK
    enum accountType "ADMIN | CUSTOMER"
  }
  BUSINESS {
    uuid id PK
    string name
    int taxRate "percent"
  }
  BUSINESS_MEMBER {
    uuid userId FK
    uuid businessId FK
    enum role "BUSINESS_ADMIN"
  }
  CUSTOMER_PROFILE {
    uuid userId FK
    uuid businessId FK
  }
  SERVICE {
    uuid id PK
    uuid businessId FK
    string name
    bool isActive
  }
  PLAN {
    uuid id PK
    uuid serviceId FK
    int price "minor units"
    enum currency "INR | USD"
    enum interval "MONTHLY | YEARLY"
  }
  SUBSCRIPTION {
    uuid id PK
    uuid planId FK
    uuid pendingPlanId FK
    enum status
    int price "snapshot at purchase"
    datetime billingPeriodStart
    datetime billingPeriodEnd
    bool cancelAtPeriodEnd
  }
  INVOICE {
    uuid id PK
    string invoiceNumber UK "INV-YYYY-000001"
    enum status
    int subtotal
    int taxRate
    int taxAmount
    int total
  }
  INVOICE_ITEM {
    uuid id PK
    int quantity
    int unitPrice
    int amount
  }
  PAYMENT {
    uuid id PK
    enum status "PENDING | SUCCESS | FAILED"
    string paymentMethod
    string transactionId UK
    string failureReason
  }
  CREDIT_LEDGER {
    uuid id PK
    enum type "CREDIT | DEBIT"
    int amount
    enum currency
  }
  SUBSCRIPTION_EVENT {
    uuid id PK
    enum type
    json metadata
  }
  IDEMPOTENCY_RECORD {
    string key
    uuid userId
    uuid businessId
    string operation
    string requestHash
    json responseBody
  }
```

**Modelling choices worth noting**

- **Tenant = `Business`.** Admins are linked through `BusinessMember`. Customers are linked per business through `CustomerProfile`, so one login can hold subscriptions across many businesses.
- **`Subscription` snapshots `price`, `currency` and `billingInterval`.** A plan repricing never rewrites an active customer's contract. It applies from the next cycle, and the customer UI tells them so.
- **`Invoice` stores `subtotal`, `taxRate`, `taxAmount` and `total`** and its line items are immutable, so historical invoices stay correct forever.
- **`CreditLedger` is append-only.** The balance is derived (credits minus debits) and never mutated in place, which gives you an audit trail and no lost updates.
- **`SubscriptionEvent` is a lifecycle audit log** (`CREATED`, `UPGRADED`, `DOWNGRADE_SCHEDULED`, `DOWNGRADE_APPLIED`, `CANCEL_REQUESTED`, `CANCELLED`, `RENEWED`, `PAYMENT_SUCCEEDED`, `PAYMENT_FAILED`). It powers the activity timelines in both UIs.
- **`IdempotencyRecord` is scoped** by `(userId, businessId, key, operation)`, so keys can't collide across users, tenants or operation types.

---

## Lifecycles and state machines

### Subscription

```mermaid
stateDiagram-v2
  [*] --> PENDING: create subscription<br/>(invoice OPEN)
  PENDING --> ACTIVE: initial payment succeeds<br/>or credit covers it
  PENDING --> PENDING: payment fails, retry on the same invoice
  ACTIVE --> ACTIVE: renewal succeeds<br/>(rolls period, applies scheduled downgrade)
  ACTIVE --> ACTIVE: upgrade invoice paid<br/>(plan switches immediately)
  ACTIVE --> PAST_DUE: renewal payment fails
  PAST_DUE --> ACTIVE: recovery payment succeeds<br/>(period advances)
  ACTIVE --> CANCELLED: cancel IMMEDIATE<br/>(unused time becomes credit)
  ACTIVE --> CANCELLED: cancel PERIOD_END<br/>(applied at next renewal run)
  CANCELLED --> [*]
```

### Invoice and payment attempts

```mermaid
stateDiagram-v2
  [*] --> OPEN: issued (tax applied, credit netted)
  OPEN --> OPEN: payment attempt FAILED<br/>(attempt recorded, invoice stays payable)
  OPEN --> PAID: payment SUCCESS<br/>or fully covered by credit
  PAID --> [*]
```

An invoice can carry **many payment attempts**. A failed attempt never blocks retrying, and a paid invoice rejects further attempts with `409 INVOICE_ALREADY_PAID`.

### Plan changes

| Change | Behaviour |
|---|---|
| **Upgrade** | Creates a **prorated** invoice and sets `pendingPlanId`. The plan **switches only when that invoice is paid**. If the payment fails, the pending change is cleared and the customer stays on the current plan. |
| **Downgrade** | Scheduled: sets `pendingPlanId` and emits `DOWNGRADE_SCHEDULED`. Applied automatically **at the next renewal**, never as an abrupt mid-cycle price drop. |
| **Guardrails** | Only one pending change at a time (`PENDING_PLAN_CHANGE_EXISTS`). Same-plan (`ALREADY_ON_PLAN`), cheaper-as-upgrade (`NOT_AN_UPGRADE`) and pricier-as-downgrade (`NOT_A_DOWNGRADE`) are all rejected, as are currency mismatches. |

---

## The billing engine

### Checkout flow (subscribe and pay)

```mermaid
sequenceDiagram
  autonumber
  participant C as Customer
  participant API as Express API
  participant DB as PostgreSQL

  C->>API: POST /subscriptions {planId, currency}<br/>Idempotency-Key: k1
  API->>DB: BEGIN
  API->>DB: INSERT IdempotencyRecord ON CONFLICT DO NOTHING
  alt key already used
    DB-->>API: existing record
    API-->>C: 201 replay stored response<br/>(409 if payload differs)
  else first time
    API->>DB: validate plan (active, service active, currency matches)
    API->>DB: upsert CustomerProfile
    API->>DB: pg_advisory_xact_lock(customer, service)
    API->>DB: reject if PENDING/ACTIVE sub exists for this service
    API->>DB: INSERT Subscription (PENDING) + CREATED event
    API->>DB: nextval('invoice_number_seq') → INV-2026-000123
    API->>DB: INSERT Invoice (OPEN) + items, tax applied
    API->>DB: apply available same-currency credit
    API->>DB: store response in IdempotencyRecord
    API->>DB: COMMIT
    API-->>C: 201 {subscription, invoice}
  end
  C->>API: POST /invoices/:id/pay {DEMO, SUCCESS}<br/>Idempotency-Key: k2
  API->>DB: SELECT … FOR UPDATE (invoice, tenant-scoped)
  API->>DB: Payment + Invoice PAID + Subscription ACTIVE + events
  API-->>C: 201 {payment, success}
```

### Renewal flow

```mermaid
flowchart TD
  A["Worker tick or internal trigger"] --> B["Find ACTIVE subscriptions past periodEnd"]
  B --> C{"Row lock FOR UPDATE<br/>still due and ACTIVE?"}
  C -- "no" --> SK["SKIPPED"]
  C -- "yes" --> D{"cancelAtPeriodEnd?"}
  D -- "yes" --> CX["CANCELLED"]
  D -- "no" --> E["Resolve renewal plan<br/>(pending plan, else current)"]
  E --> F["Issue invoice: price + tax<br/>next sequence number"]
  F --> G["Apply same-currency credit"]
  G --> H{"Remaining = 0?"}
  H -- "yes" --> I["Mark PAID via CREDIT<br/>roll period, RENEWED"]
  H -- "no" --> J["Settle payment"]
  J --> K{"Outcome"}
  K -- "success" --> L["Roll period, apply scheduled plan,<br/>RENEWED"]
  K -- "failed" --> M["PAST_DUE, invoice stays OPEN"]
```

The whole renewal for one subscription runs in **one transaction**. It either fully happens (invoice, credit debit, payment, period roll, events) or not at all.

### Money math

**Proration** is time-based. Given `remaining = periodEnd − now` and `total = periodEnd − periodStart`:

```
ratio          = remaining / total
oldPlanCredit  = round(oldPrice × ratio)
newPlanCharge  = round(newPrice × ratio)
netAmount      = newPlanCharge − oldPlanCredit      → tax is applied on the net
```

Worked example (from the unit tests): ₹300.00 → ₹500.00 upgrade with 16 of 31 days remaining gives a credit of **₹154.84**, a charge of **₹258.06** and a net of **₹103.22**. The invoice shows both as itemised lines.

**Immediate cancellation** turns the unused fraction of the paid period into a `CREDIT` ledger entry (`floor(price × remaining / total)`). The next invoice in that currency consumes it automatically as a `DEBIT`. If credit fully covers an invoice, it is settled with method `CREDIT` and **no payment attempt is created**.

**Billing periods** clamp to month ends (`Jan 31 + 1 month → Feb 28`; `Feb 29 + 1 year → Feb 28`) instead of overflowing into the next month, and all arithmetic is UTC.

**Tax** is a per-business percentage, applied once and rounded to the nearest minor unit. It is stored on the invoice (`taxRate`, `taxAmount`) so later rate changes never alter history.

---

## Design decisions

| Decision | Why | Where |
|---|---|---|
| **Idempotency record and business write share one transaction** | A crash between "recorded key" and "did the work" can't strand a request. Retries either replay the response or run the whole operation. `INSERT … ON CONFLICT DO NOTHING RETURNING` makes key ownership atomic under races. | `shared/utils/idempotency.ts` |
| **Request hashing for key reuse** | Same key with a different payload is a client bug, so it fails loudly (`409`) instead of returning the wrong stored result. | `createRequestHash` |
| **Postgres advisory lock for subscription creation** | "One live subscription per customer per service" is a cross-row invariant a unique index can't express (it spans `Subscription → Plan → Service` and status sets). A transaction-scoped lock on `(customer, service)` serializes competing creators. | `subscription.service.ts` |
| **`SELECT … FOR UPDATE` for payments and renewals** | Two concurrent payments can't double-charge one invoice, and two concurrent billing runs can't double-renew one subscription. | `payment.service.ts`, `recurring-billing.service.ts` |
| **Postgres sequence for invoice numbers** | Unique, monotonic, human-readable numbers (`INV-2026-000418`) with no read-modify-write race. | `invoice-number.service.ts` |
| **Integer minor units everywhere** | No floating-point drift in financial data. The UI converts once at the edge and rounds explicitly. | schema + `lib/format.ts` |
| **Normalised unique indexes for names** | `LOWER(BTRIM(name))` uniqueness on services (per business) and plans (per service) is enforced by the database, so it holds under concurrent creates. The error handler maps `P2002` to a clean `409`. | migration `add_unique_service_plan_names` |
| **Credit as a ledger, not a balance column** | Append-only entries give auditability and eliminate lost-update bugs. Balance is derived per currency. | `credit.service.ts` |
| **Subscription snapshots price** | Repricing a plan can't change what existing customers are billed mid-cycle. | `Subscription.price` |
| **Refresh-token rotation as compare-and-swap** | `updateMany where revokedAt IS NULL` means only one of two concurrent refreshes wins, and reuse of a rotated token fails. Refresh tokens are stored **hashed** (SHA-256). | `auth.service.ts` |
| **Pagination with `take + 1`** | `hasNextPage` without a second count query on hot paths. Admin lists add a `total` for the pager. | `shared/utils/pagination.ts` |
| **Domain math isolated from I/O** | Proration, tax and interval logic are pure functions with direct unit tests. | `modules/billing/*` |
| **Fail-fast configuration** | Missing or weak secrets crash the boot, not the first request. | `config/env.ts` |
| **404 for cross-tenant resource reads** | Not-yours and doesn't-exist are indistinguishable, so IDs can't be enumerated. | tenant-isolation suites |

---

## Payments

Payments in Subvia run in **demo mode by design**. The payment outcome is *selected by the caller* (`SUCCESS` or `FAILED`) instead of being decided by an external gateway. That is deliberate, and it gives you things a live gateway can't:

- **Reproducible failure paths.** Declines, `PAST_DUE` transitions, dunning-style recovery and failed-upgrade rollbacks can be triggered on demand, in tests and in the UI.
- **Deterministic CI.** The whole billing lifecycle runs end to end with no network calls, sandbox keys or flaky third parties.
- **A safe demo.** The checkout collects card or UPI details in the UI. Nothing is stored or sent anywhere, and the panel says so.

### One settlement seam

All money movement is settled through a single function:

```ts
processPayment(tx, { invoiceId, subscriptionId, amount, currency, paymentMethod, result })
```

Everything downstream (invoice → `PAID`, subscription activation, upgrade application, `PAST_DUE` recovery, period rolling, lifecycle events) hangs off that call and runs inside the caller's transaction. A real gateway only has to produce a `result` for that same call, so **no lifecycle logic changes when a provider is introduced.**

```ts
// Sketch of the extension contract (illustrative):
interface PaymentProvider {
  charge(input: { amount: number; currency: Currency; method: string; invoiceId: string }):
    Promise<{ result: "SUCCESS" | "FAILED"; transactionId?: string; failureReason?: string }>;
}
```

The internal renewal trigger takes the same simulated outcome, so renewal failure and recovery are also testable without waiting on real declines.

---

## Security model

| Layer | Control |
|---|---|
| **Authentication** | Short-lived JWT access tokens (default 15 min) and rotating, hashed, revocable refresh tokens. Passwords use bcrypt with cost 12. Emails are normalised case-insensitively. |
| **Authorization** | Two composable guards: `requireAccountType(ADMIN or CUSTOMER)` then `requireBusinessRole(BUSINESS_ADMIN)`. Customer-portal queries are scoped to `customerProfile.userId`. Admin queries are scoped to `businessId`. |
| **Tenant isolation** | Enforced in queries, not just middleware. Payments and renewals re-join through `CustomerProfile` to verify ownership inside the locking query. |
| **Internal endpoint** | The billing trigger requires `X-Internal-Token`, compared with `crypto.timingSafeEqual`. |
| **Abuse protection** | `express-rate-limit` on auth (20 per 15 min) and on payments (30 per 15 min). Limits are relaxed under `NODE_ENV=test`. |
| **Input validation** | Zod 4 schemas on every params, query and body, with a body size limit of 100 KB. |
| **HTTP hardening** | `helmet`, and CORS locked to the configured frontend origin. |
| **Error hygiene** | Domain errors map to stable codes. Unknown errors return a generic `500` with no internals leaked. |

---

## Testing strategy

Tests are **integration-first**. They boot the real Express app on an ephemeral port and hit it over real HTTP, against a real PostgreSQL database that is truncated between tests. There are no mocked repositories, so what passes here is what runs in production, including SQL, locks and transactions.

| Suite | What it proves |
|---|---|
| `auth` | Registration and normalisation, login, `/me` contract, refresh rotation, and **only one of two concurrent refreshes succeeds**. |
| `account-access` | ADMIN vs CUSTOMER separation across business creation and the catalog. |
| `tenant-isolation`, `tenant-isolation-final`, `business-catalog` | Cross-tenant reads and writes on businesses, services, plans, subscriptions, invoices, payments and credits are blocked. Cross-customer access to billing records is blocked. |
| `subscription-payment` | The full lifecycle: pending → active on payment, failed-then-retried payments, upgrade applied only on paid invoice, scheduled downgrades, currency and plan guardrails, immutable historical invoices, unique invoice numbers, and **concurrent creation and concurrent payment races**. |
| `idempotency` | Replay, key-reuse conflicts, missing-key rejection, tenant-scoped keys, no records left after failed operations, and no duplicate credits or payments on retry. |
| `recurring-billing`, `recurring-billing-security` | Renewal, `PAST_DUE`, scheduled-downgrade application, period-end cancellation, `PAST_DUE` recovery, **the same subscription processed once under concurrent runs**, and internal-token auth. |
| `cancellation-credits` | Period-end vs immediate cancellation, credit creation, per-currency balances, credit auto-applied to renewals, and no payment created when credit covers the invoice. |
| `catalog-customer`, `customer-portal` | Cross-business catalog, filters, hidden inactive items, customer-only endpoints, and portal isolation. |
| `unit/proration`, `unit/credit` | Money math, including boundaries and invalid-input guards. |

```bash
cd backend
npm test            # run once
npm run test:watch  # watch mode
```

---

## API reference

Base URL: `/api/v1`. Authenticated routes need `Authorization: Bearer <accessToken>`. Billing mutations need `Idempotency-Key: <unique string>`.

### Auth
| Method | Path | Notes |
|---|---|---|
| `POST` | `/auth/register` | `intent`: `ADMIN` or `CUSTOMER` |
| `POST` | `/auth/login` | returns `accessToken`, `refreshToken`, `user` |
| `POST` | `/auth/refresh` | rotates the refresh token |
| `POST` | `/auth/logout` | revokes the refresh token |
| `GET` `PATCH` | `/auth/me` | profile |

### Admin: catalog and operations (ADMIN and business member)
| Method | Path | Notes |
|---|---|---|
| `POST` `GET` | `/businesses`, `/businesses/my` | create and list your businesses |
| `GET` `PATCH` | `/businesses/:id` | includes `taxRate` |
| `POST` `GET` `PATCH` | `/businesses/:businessId/services[/:serviceId]` | |
| `POST` `GET` `PATCH` | `/businesses/:businessId/services/:serviceId/plans[/:planId]` | price is in minor units |
| `GET` | `/businesses/:businessId/admin/dashboard` | aggregate metrics |
| `GET` | `/businesses/:businessId/admin/{customers,subscriptions,invoices,payments,billing-activity}` | paginated, with `:id` detail routes |
| `POST` | `/businesses/:businessId/admin/customers` | attach an existing CUSTOMER account |

### Customer portal (CUSTOMER)
| Method | Path | Notes |
|---|---|---|
| `GET` | `/catalog` | filters: `search`, `currency`, `interval`, `businessId` |
| `POST` | `/subscriptions` | 🔑 idempotent, resolves the business from `planId` and never trusts a client-sent tenant |
| `GET` | `/subscriptions`, `/subscriptions/:id`, `/subscriptions/:id/events` | |
| `POST` | `/subscriptions/:id/upgrade` `/downgrade` `/cancel` | 🔑 idempotent, cancel modes: `PERIOD_END` or `IMMEDIATE` |
| `GET` | `/invoices`, `/invoices/:id` | |
| `POST` | `/invoices/:id/pay` | 🔑 idempotent, rate-limited |
| `GET` | `/credits`, `/billing-activity` | per-currency balance and merged invoice and payment timeline |

### Internal
| Method | Path | Notes |
|---|---|---|
| `POST` | `/internal/billing/run` | `X-Internal-Token` required, body `{ "result": "SUCCESS" or "FAILED" }` |

### Conventions

```jsonc
// success
{ "success": true, "data": { … }, "pagination": { "page": 1, "limit": 20, "hasNextPage": false } }

// failure
{ "success": false, "error": { "code": "INVOICE_ALREADY_PAID", "message": "This invoice has already been paid." } }
```

---

## Frontend

React 19 · Vite · Tailwind CSS 4 · TanStack Query · Zustand · React Router 7 · Recharts · Sonner

**Customer portal:** a glass-styled UI with a fanned subscription hero on the dashboard, spend and billing overviews, a searchable and filterable catalog across businesses, a checkout with **live invoice preview** (tax and credit applied), subscription pages with an event timeline and plan-change cards, invoice pages with a print stylesheet for **PDF export**, and a day-grouped billing activity feed.

**Admin workspace:** a business switcher for multi-business operators, a dashboard with status donut and recent invoices, services and plans management (with major→minor unit conversion handled at the input edge), customer directory, subscription, invoice and payment drill-downs, and a business-wide activity timeline.

**Engineering details**
- Route guards by account type (`ProtectedRoute` → `AdminAccountRoute` and `CustomerAccountRoute`) send each role to its own surface.
- The Axios client attaches tokens and, on `401`, performs a **single-flight refresh**. Concurrent failing requests share one refresh and are replayed, and a failed refresh clears state and redirects.
- Idempotency keys are generated per user action (`crypto.randomUUID()`), so double-clicks and network retries are safe end to end.
- Money display goes through one formatter (`formatMoney` / `MoneyText`) with INR (`en-IN`) and USD support, and multi-currency totals are never summed together.
- Loading, empty and error states are handled consistently through shared components.

---

## Demo data

A deterministic seed script talks to the database through Prisma and needs no running server.

```bash
cd backend
npx tsx scripts/seed-demo.ts
```

It is safe to re-run: it removes only its own previous demo data first.

| Creates | Count |
|---|---|
| Businesses (CloudHarbor, MetricForge, TeamFlow, SecureVault, MailPilot, LedgerDesk, Supportly, DevPulse) | 8 |
| Services / plans | 40 / 160 |
| Customers | 36 |
| Subscriptions across `ACTIVE`, `PENDING`, `PAST_DUE`, period-end cancel and `CANCELLED` states | ~150+ |
| Invoices, payments (success and failed), credits and lifecycle events | ✔ |

| Role | Email | Password |
|---|---|---|
| Admin (all 8 businesses) | `seed.admin@billingos.local` | `DemoPassword123!` |
| Customer | `seed.customer.01@billingos.local` … `36@…` | `DemoPassword123!` |

---

## Project structure

```
.
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/              # incl. invoice_number_seq + normalised unique indexes
│   ├── scripts/                     # seed-demo.ts + README
│   ├── src/
│   │   ├── app.ts · server.ts
│   │   ├── config/                  # env validation (fail-fast), prisma client
│   │   ├── middleware/              # auth, account-type, business-role, internal, rate-limit, errors
│   │   ├── shared/utils/            # idempotency, pagination, billing-period, route wrapper
│   │   └── modules/
│   │       ├── auth/  businesses/  customers/
│   │       ├── services/  plans/  catalog/
│   │       ├── subscriptions/  invoices/  payments/  credits/
│   │       ├── billing/
│   │       │   ├── proration/  tax/  billing-interval.ts
│   │       │   └── recurring/       # service · worker · internal controller/routes
│   │       ├── admin/               # read models for the admin workspace
│   │       └── customer-portal/     # customer-scoped read/write endpoints
│   └── tests/                       # integration suites + unit/
└── frontend/
    └── src/
        ├── api/                     # typed API clients
        ├── components/              # admin/, customer/, catalog/, shared UI
        ├── hooks/  lib/  stores/    # query hooks, formatters, auth store
        ├── layouts/  routes/        # AdminLayout, CustomerLayout, guards, router
        └── pages/                   # marketing, auth, onboarding, workspace, admin/, customer/
```

---

## Extending Subvia

The seams are already in the design:

- **Payment gateway.** Implement a provider that produces a `result` and feed it into `processPayment`. Idempotency, locking, lifecycle transitions and events all stay as they are.
- **Additional currencies.** Currency is an enum on plans, subscriptions, invoices, payments and the ledger, and credits are already tracked per currency.
- **Scheduling.** The renewal worker is in-process, and the same logic is exposed through the token-guarded internal endpoint, so an external scheduler (cron, a queue, a cloud scheduler) can drive it. Row locks make multiple runners safe.
- **Invoice states.** The invoice status enum already models `DRAFT` and `VOID` for manual and adjustment workflows.
