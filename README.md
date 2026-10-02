# Subvia

**Multi-tenant SaaS subscription and billing platform built with React, Node.js, Express, PostgreSQL, Prisma, and TypeScript.**

Subvia lets a *business* publish services and pricing plans, and lets its *customers* subscribe, receive invoices, pay, change plans and cancel. An admin workspace gives business operators visibility into customers, subscriptions, invoices, payments and billing activity, while a separate customer portal handles the subscriber side.

The project concentrates on the hard parts of a billing domain rather than on CRUD: multi-tenant data isolation, role-based access, subscription state transitions, prorated upgrades, scheduled downgrades, a credit ledger, tax-aware invoicing, recurring renewals, idempotent mutations and transactional consistency. Behaviour is covered by integration tests that run against a real PostgreSQL database.

### Why Subvia?

Subvia was built to explore the engineering problems behind subscription
billing rather than treating billing as simple CRUD. The project focuses on
subscription state transitions, prorated plan changes, invoice generation,
credits, payment failures, idempotency, tenant isolation and concurrency.

The goal is to model the financial lifecycle carefully enough that retries,
failures and concurrent requests do not create inconsistent billing records.


## Project Preview

<table>
  <tr>
    <td width="50%">
      <img src="CUSTOMER_URL" alt="Customer dashboard" width="100%" />
    </td>
    <td width="50%">
      <img src="ADMIN_URL" alt="Admin dashboard" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="INVOICE_URL" alt="Invoice detail" width="100%" />
    </td>
    <td width="50%">
      <img src="SUBSCRIPTION_URL" alt="Subscription detail" width="100%" />
    </td>
  </tr>
</table>
---

## Table of contents

1. [Overview](#overview)
2. [Key features](#key-features)
3. [Architecture](#architecture)
4. [Domain model](#domain-model)
5. [Core billing flows](#core-billing-flows)
6. [Subscription lifecycle](#subscription-lifecycle)
7. [Payments](#payments)
8. [Important engineering decisions](#important-engineering-decisions)
9. [Security and multi-tenancy](#security-and-multi-tenancy)
10. [Testing strategy](#testing-strategy)
11. [Tech stack](#tech-stack)
12. [Quick start](#quick-start)
13. [Environment variables](#environment-variables)
14. [Demo data](#demo-data)
15. [API overview](#api-overview)
16. [Frontend](#frontend)
17. [Project structure](#project-structure)
18. [Future extensions](#future-extensions)

---

## Overview

There are two account types, each with its own interface:

| Account | Interface | What they do |
|---|---|---|
| **ADMIN** | Admin workspace (`/admin/:businessId`) | Create businesses, manage services and plans, set the business tax rate, add existing customers, and inspect customers, subscriptions, invoices, payments and a business-wide billing activity timeline. One admin can belong to several businesses and switch between them. |
| **CUSTOMER** | Customer portal (`/customer`) | Browse a catalog across businesses, subscribe, pay invoices, upgrade, downgrade or cancel, and view credit and billing history. One customer account can hold subscriptions with many businesses. |

How the domain fits together:

- A **Business** is the tenant. It owns **Services**, and each Service has one or more **Plans** (price in minor units, currency, monthly or yearly interval).
- A **CustomerProfile** links a user to a business. A **Subscription** belongs to a customer profile and points at a plan.
- Each billable event produces an **Invoice** with **InvoiceItems**. Invoices are settled by **Payment** attempts and/or by **CreditLedger** entries.
- Every lifecycle transition is recorded as a **SubscriptionEvent**, which powers the activity timelines.

---

## Key features

### Authentication and access control
- Registration with an account type (`ADMIN` or `CUSTOMER`), login, logout
- JWT access tokens plus rotating, hashed, revocable refresh tokens
- Account-type guard and business-role guard (`BUSINESS_ADMIN`) on admin routes
- Role-based frontend route guards

### Multi-tenancy
- Business as the tenant, with admin access through `BusinessMember`
- Customers attached per business through `CustomerProfile`
- Tenant-scoped queries for admin data and user-scoped queries for customer data

### Catalog management
- Services and plans with unique (case- and whitespace-insensitive) names, enforced by the database
- Price in integer minor units, `INR` or `USD`, `MONTHLY` or `YEARLY`
- Active/inactive services and plans, filtered out of the customer catalog
- Customer catalog with search, currency, interval and business filters

### Subscription management
- Subscription creation with a `PENDING → ACTIVE` activation on payment
- Prorated upgrades, applied when the upgrade invoice is paid
- Downgrades scheduled for the next renewal
- Cancellation at period end or immediately (unused time becomes credit)
- `PAST_DUE` handling and recovery by paying the failed invoice
- Recurring renewals through a background worker

### Billing
- Sequential, human-readable invoice numbers (`INV-2026-000123`)
- Per-business tax rate stored on each invoice
- Itemised invoices, including proration credit lines
- Append-only credit ledger, tracked per currency and applied automatically to invoices
- Multiple payment attempts per invoice, with failures recorded
- Customer invoice view with print-to-PDF

### Reliability and backend engineering
- Idempotency keys on all billing mutations
- Prisma transactions, `SELECT … FOR UPDATE` and PostgreSQL advisory locks
- Background workers for recurring billing, webhook delivery and maintenance cleanup
- Zod validation, a centralised error handler with stable error codes, and rate limiting
- Fail-fast environment validation

### Developer integrations
- Per-business signed webhook endpoints that receive subscription lifecycle events, queued in the database and retried with backoff
- Business-scoped API keys for an authenticated public catalog endpoint

---

## Architecture

Subvia is a **modular monolith**: a single Express API organised into feature modules, one React SPA, and one PostgreSQL database.

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
    CTRL["Controllers: Zod validation"]
    SVC["Domain services (transaction boundaries)"]
    ENG["Billing engine: proration · tax · credits · billing intervals"]
    IDEM["Idempotency layer"]
    ERR["Central error handler: stable error codes"]
    MW --> CTRL --> SVC
    SVC --> ENG
    SVC --> IDEM
    CTRL -.-> ERR
  end

  WORKER["Background workers: recurring billing · webhook delivery · maintenance cleanup"]
  INTERNAL["POST /internal/billing/run (X-Internal-Token)"]
  DB[("PostgreSQL · Prisma 7 + pg adapter")]

  ADM --> MW
  CUS --> MW
  SVC --> DB
  WORKER --> SVC
  INTERNAL --> SVC
```

Each backend feature is a module (`routes → controller → service → schema`). Controllers parse and shape HTTP. **Services own transaction boundaries and business rules.** Cross-cutting code (idempotency, pagination, billing periods) lives in `shared/`, and the money math (proration, tax, billing intervals) lives in `modules/billing/` as plain functions that are unit-tested directly.

### Request pipeline

1. The request enters the Express app: `helmet`, CORS (restricted to `FRONTEND_URL`) and a 100 KB JSON body limit.
2. A general rate limiter applies to the API (the health endpoint is registered before it).
3. Route-level middleware runs: `authenticate` (JWT), then `requireAccountType`, then `requireBusinessRole` on admin routes. Payment routes also pass through a payment rate limiter.
4. The controller validates `params`, `query` and `body` with Zod and reads the `Idempotency-Key` header where required.
5. The service runs the operation, usually inside `prisma.$transaction`, with the idempotency record, locks and business writes sharing that transaction.
6. The response uses a uniform envelope: `{ success: true, data, pagination? }` or `{ success: false, error: { code, message } }`. Domain errors are mapped to stable codes by the central error handler.

---

## Domain model

The diagram shows the core billing model. Webhook endpoints, webhook deliveries and API keys are additional business-scoped tables and are omitted for readability.

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

Key relationships:

- **Business → Services → Plans.** A business owns its catalog.
- **Business → CustomerProfiles ← User.** A customer profile is the per-business identity of a user, so one account can subscribe across businesses.
- **CustomerProfile → Subscriptions → Invoices → InvoiceItems / Payments.** Billing documents hang off the subscription and carry their own copy of price, tax and totals.
- **Subscription.price is a snapshot.** Repricing a plan does not change what an existing subscription is billed until its next cycle.
- **CreditLedger** belongs to the customer profile and is append-only. Balance is derived (credits minus debits) per currency, and debit rows reference the invoice they were applied to.
- **Subscription.pendingPlanId** holds a scheduled downgrade or an upgrade awaiting payment.
- **IdempotencyRecord** is unique on `(userId, businessId, key, operation)`.

---

## Core billing flows

### Subscription creation and initial payment

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
    API-->>C: replay stored response<br/>(409 if payload differs)
  else first time
    API->>DB: validate plan (active, service active, currency matches)
    API->>DB: upsert CustomerProfile
    API->>DB: pg_advisory_xact_lock(customer, service)
    API->>DB: reject if PENDING/ACTIVE sub exists for this service
    API->>DB: INSERT Subscription (PENDING) + CREATED event
    API->>DB: nextval('invoice_number_seq')
    API->>DB: INSERT Invoice (OPEN) + items, tax applied
    API->>DB: apply available same-currency credit
    API->>DB: store response in IdempotencyRecord
    API->>DB: COMMIT
    API-->>C: 201 {subscription, invoice}
  end
  C->>API: POST /invoices/:id/pay {DEMO, SUCCESS}<br/>Idempotency-Key: k2
  API->>DB: SELECT … FOR UPDATE (invoice, owner-scoped)
  API->>DB: Payment + Invoice PAID + Subscription ACTIVE + events
  API-->>C: 201 {payment, success}
```

The customer picks a plan and the server derives the business from it. The client never sends a tenant id for checkout. If available credit covers the whole invoice, the invoice is settled with a `CREDIT` method and the subscription activates without a card-style payment step.

### Invoice generation

- Invoice numbers come from a PostgreSQL sequence: `INV-<year>-<6 digits>`.
- Tax is `round(subtotal × taxRate / 100)` using the business tax rate (an integer percentage), stored as `taxRate` and `taxAmount` on the invoice.
- Credit is applied after tax: `total` is reduced to the remaining amount, so `subtotal + taxAmount − total` equals the credit applied.

### Credits

Credits are created by immediate cancellation (the unused part of the current period). When a later invoice is generated in the same currency, available credit is consumed automatically and recorded as a `DEBIT` row linked to the invoice. Credit of one currency is never applied to an invoice in another.

### Upgrade and downgrade

- **Upgrade** (only on an `ACTIVE` subscription, same service, same currency, higher price): proration is computed from the exact change time.

  ```
  ratio         = remaining / total          (period milliseconds)
  oldPlanCredit = round(oldPrice × ratio)
  newPlanCharge = round(newPrice × ratio)
  netAmount     = newPlanCharge − oldPlanCredit
  ```

  An invoice with two lines (upgrade charge and unused-time credit) is created, tax is applied to the net amount, and `pendingPlanId` is set. The plan switches when that invoice is paid. If the payment fails the pending change is cleared, and a later successful payment on the same invoice still applies the upgrade.
- **Downgrade** (lower price): scheduled by setting `pendingPlanId`, with a `DOWNGRADE_SCHEDULED` event. It is applied at the next renewal.
- Only one pending change is allowed at a time, and same-plan, wrong-direction and currency-mismatch requests are rejected with distinct error codes.

### Cancellation

- **`PERIOD_END`** sets `cancelAtPeriodEnd` and emits `CANCEL_REQUESTED`. The recurring billing run turns it into `CANCELLED` when the period ends, without creating a renewal invoice.
- **`IMMEDIATE`** cancels at once and credits the unused part of the period to the credit ledger.

### Recurring billing

1. A background worker (every 60 seconds), or a call to the token-protected internal endpoint, finds `ACTIVE` subscriptions whose `billingPeriodEnd` has passed.
2. Each subscription is processed in its own transaction. The row is locked with `SELECT … FOR UPDATE` and re-checked, so overlapping runs skip anything already handled.
3. If `cancelAtPeriodEnd` is set, the subscription becomes `CANCELLED`.
4. Otherwise the renewal plan is the pending plan (if any) or the current plan. An invoice is issued with tax and available credit is applied.
5. If credit covers the invoice, it is marked `PAID` and the period rolls forward. Otherwise a payment is settled: on success the period rolls forward, the scheduled plan is applied and `RENEWED` is recorded. On failure the subscription becomes `PAST_DUE` and the invoice stays `OPEN`.
6. Paying a `PAST_DUE` invoice reactivates the subscription and advances the billing period.

Billing periods clamp to month ends (`Jan 31 + 1 month → Feb 28`, `Feb 29 + 1 year → Feb 28`) and are calculated in UTC.

---

## Subscription lifecycle

```mermaid
stateDiagram-v2
  [*] --> PENDING: create subscription<br/>(invoice OPEN)
  PENDING --> ACTIVE: initial payment succeeds<br/>or credit covers it
  PENDING --> PENDING: payment fails, retry on the same invoice
  ACTIVE --> ACTIVE: renewal succeeds<br/>(rolls period, applies scheduled downgrade)
  ACTIVE --> ACTIVE: upgrade invoice paid<br/>(plan switches)
  ACTIVE --> PAST_DUE: renewal payment fails
  PAST_DUE --> ACTIVE: recovery payment succeeds<br/>(period advances)
  ACTIVE --> CANCELLED: cancel IMMEDIATE<br/>(unused time becomes credit)
  ACTIVE --> CANCELLED: cancel PERIOD_END<br/>(applied at next renewal run)
  CANCELLED --> [*]
```

Invoices move `OPEN → PAID`. A failed payment attempt is recorded against the invoice and leaves it `OPEN`, so it can be retried. Paying an already-paid invoice is rejected with `INVOICE_ALREADY_PAID`.

---

## Payments

Payments are intentionally implemented as a **demo payment flow**, so the whole billing lifecycle can be exercised end to end without moving real money.

- Payment attempts are first-class records in the billing domain: each has an amount, currency, method, status (`SUCCESS` or `FAILED`), transaction id on success and a failure reason on failure.
- The customer checkout and payment pages present card and UPI forms, and the user chooses a **success or failure outcome**. The portal submits payment method `DEMO` with that outcome. Card and UPI details entered in the form are not transmitted or stored, and no real card, UPI or bank transaction takes place.
- Because outcomes are selectable, every state transition is reproducible on demand: initial activation, a declined first payment and retry, a failed upgrade, a failed renewal moving a subscription to `PAST_DUE`, and recovery. The internal billing trigger accepts the same simulated outcome for renewals.
- This keeps the project focused on billing-domain behaviour instead of card handling and provider infrastructure.

All settlement runs through one function, `processPayment`, which is called inside the caller's transaction. Invoice status, subscription activation, upgrade application, `PAST_DUE` recovery, period rolling and lifecycle events all follow from it. That makes it the natural point for a real payment provider to plug in later without changing the surrounding lifecycle logic.

---

## Important engineering decisions

| Decision | Why |
|---|---|
| **Idempotency record and business write share one transaction** (`INSERT … ON CONFLICT DO NOTHING RETURNING`) | Key ownership is atomic under races. A retry either replays the stored response or runs the whole operation, and a failed operation leaves no record behind. |
| **Request hash per idempotency key** | Reusing a key with a different payload fails with `409 IDEMPOTENCY_KEY_REUSED` instead of returning the wrong stored result. Keys are scoped by user, business and operation. |
| **Advisory lock for subscription creation** | "One `PENDING`/`ACTIVE` subscription per customer per service" spans several tables and statuses, which a unique index can't express. A transaction-scoped lock on `(customer, service)` serialises competing creators. |
| **`SELECT … FOR UPDATE` on invoices and subscriptions** | Concurrent payments can't pay one invoice twice, and concurrent billing runs can't renew one subscription twice. |
| **Integer minor units everywhere** | No floating-point drift. Rounding happens explicitly in the tax and proration functions. |
| **Postgres sequence for invoice numbers** | Unique, increasing, human-readable numbers with no read-modify-write race. |
| **Subscription snapshots price, currency and interval** | A plan change by the business does not alter an existing customer's contract mid-cycle. |
| **Append-only credit ledger** | Balance is derived from entries, so there is an audit trail and no in-place balance updates. |
| **Pending-plan model for upgrades and downgrades** | One mechanism covers both: an upgrade is applied on payment, a downgrade on renewal. |
| **Domain math as pure functions** | Proration, tax and billing-interval logic can be unit-tested without HTTP or a database. |
| **Database-enforced unique names** | `LOWER(BTRIM(name))` unique indexes on services (per business) and plans (per service) hold under concurrent creates; the error handler maps the violation to a `409`. |
| **Refresh-token rotation as compare-and-swap** | `updateMany` with `revokedAt IS NULL` means only one of two concurrent refreshes succeeds. Tokens are stored hashed. |
| **Webhook deliveries queued in the same transaction as the event** | A lifecycle event and its delivery rows commit together, and a worker delivers them with retries, so events are not lost if delivery fails. |
| **Fail-fast configuration** | Missing or weak secrets stop the process at boot rather than at the first request. |
| **Pagination with `take + 1`** | `hasNextPage` is known without an extra count on customer lists. Admin lists also return a `total`. |

---

## Security and multi-tenancy

**Authentication**
- Passwords are hashed with bcrypt (cost 12) and must be at least 8 characters. Emails are normalised to lowercase.
- Login compares against a dummy hash when the user does not exist, so unknown and known emails take similar time.
- Access tokens are short-lived JWTs (default `15m`). Refresh tokens are random, stored as SHA-256 hashes, rotated on every refresh and revocable on logout; expired tokens are cleaned up by a maintenance worker.
- The frontend refreshes access tokens automatically on `401` through a single shared refresh request.

**Authorization and tenant isolation**
- Admin routes pass through `authenticate → requireAccountType("ADMIN") → requireBusinessRole("BUSINESS_ADMIN")`. The role guard looks up the `BusinessMember` row for `(userId, businessId)` and returns `403` for non-members.
- Admin read models are filtered by `businessId`. Customer-portal queries are filtered by `customerProfile.userId`, so a customer only sees their own subscriptions, invoices, payments and credits.
- Payments lock the invoice with a query that joins `CustomerProfile` on both user and business, so an invoice can only be paid by its owner. Cross-tenant reads of subscriptions, invoices, payments and credits return `404`, which does not reveal whether the record exists.
- Customer-only endpoints reject admin accounts and vice versa.

**Request protection**
- `helmet`, CORS restricted to the configured frontend origin, a 100 KB body limit and Zod validation on all inputs.
- Rate limits: general API (300 per minute), auth routes (20 per 15 minutes), payment routes (30 per 15 minutes), public API (120 per 15 minutes). Limits are relaxed when `NODE_ENV=test`.
- The internal billing endpoint requires `X-Internal-Token`, compared with `crypto.timingSafeEqual`.
- Unknown errors return a generic `500` without internal details.

**Integrations**
- Webhook signing secrets are encrypted at rest (AES-256-GCM) and shown once at creation. Deliveries are signed with HMAC-SHA256 over `timestamp.payload` and sent with event, delivery-id, timestamp and signature headers.
- Webhook URLs must be `https` outside tests and must not resolve to loopback, private or other reserved IPv4/IPv6 ranges. The check runs when saving the URL and again at delivery time, where the resolved address is pinned.
- API keys are random, stored as SHA-256 hashes, shown once, revocable, and expire within a configurable maximum lifetime.

---

## Testing strategy

Tests use **Vitest** and are integration-first. The suite starts the real Express app on an ephemeral port, sends real HTTP requests, and runs against a real PostgreSQL database that is truncated between tests. There are no mocked repositories. A setup guard refuses to run unless `TEST_DATABASE_URL` points at a database whose name ends in `_test`.

| Area | Covered |
|---|---|
| Authentication | Registration and normalisation, login, `/me`, refresh rotation, rejected reuse, concurrent refresh (only one succeeds) |
| Access control | ADMIN vs CUSTOMER separation, customer-only and admin-only endpoints |
| Tenant isolation | Cross-business access to businesses, services, plans, subscriptions, invoices, payments and credits; cross-customer access in the portal |
| Subscriptions and payments | Pending-to-active on payment, failed and retried payments, upgrade applied only on a paid invoice, scheduled downgrades, single pending change, currency and plan guardrails, immutable historical invoices, unique invoice numbers, concurrent subscription creation, concurrent payments on one invoice |
| Idempotency | Replay, key reuse with a different payload, missing key, tenant-scoped keys, no leftover record after a failed operation, no duplicate credits or payments on retry |
| Recurring billing | Renewal, failed renewal to `PAST_DUE`, scheduled downgrade at renewal, period-end cancellation, `PAST_DUE` recovery, the same subscription processed once under concurrent runs, internal-token authentication |
| Cancellation and credits | Period-end vs immediate cancellation, credit creation, per-currency balances, credit applied to renewals, credit-covered renewals |
| Catalog and customer portal | Cross-business catalog and filters, hidden inactive items, customer-scoped endpoints |
| Hardening | Health check, webhook URL restrictions, webhook secret encryption, cleanup of expired refresh tokens and idempotency records |
| Unit tests | Proration (including boundaries and invalid periods) and credit invariants |

```bash
cd backend
npm test             # vitest run --no-file-parallelism
npm run test:watch
```

---

## Tech stack

Versions below are the ranges declared in the `package.json` files.

### Backend
- Node.js 22.12 or later, TypeScript 7
- Express 5, Zod 4
- JWT (`jsonwebtoken`), `bcrypt`
- `helmet`, `cors`, `express-rate-limit`
- `tsx` for development

### Database
- PostgreSQL
- Prisma 7 with the `@prisma/adapter-pg` driver adapter and SQL migrations

### Frontend
- React 19, Vite 8, TypeScript 6
- React Router 7
- TanStack Query 5, Zustand 5, Axios
- Tailwind CSS 4 with a small set of shadcn-style Base UI primitives and custom components
- Recharts, Sonner, Lucide icons

### Testing and tooling
- Vitest 5
- oxlint (frontend)

---

## Quick start

### Prerequisites
- Node.js 22.12 or later
- A running PostgreSQL instance

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <repo>

cd backend && npm install
cd ../frontend && npm install
```

<!-- TODO: Replace <your-repo-url> with the final repository URL -->

### 2. Configure the backend

Create a PostgreSQL database for development, then create `backend/.env` (see [Environment variables](#environment-variables)).

```bash
cd backend
npx prisma migrate deploy   # applies all migrations, including the invoice-number sequence
npx prisma generate         # generates the client into src/generated/prisma
npm run dev                 # API on http://localhost:3000 (PORT)
```

Health check: `GET /api/v1/health`.

### 3. Configure and start the frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

```bash
cd frontend
npm run dev                 # Vite dev server
```

`FRONTEND_URL` in the backend `.env` must match the origin the Vite dev server runs on (Vite's default is `http://localhost:5173`).

### 4. Run the tests

Tests need a **separate** database whose name ends in `_test`. Create `backend/.env.test` (see below), apply migrations to that database, then run the suite:

```bash
cd backend
DATABASE_URL="postgresql://user:password@localhost:5432/subvia_test" npx prisma migrate deploy
npm test
```

On Windows PowerShell, set the variable first: `$env:DATABASE_URL="..."`.

> The test suite truncates every table between tests. Never point `TEST_DATABASE_URL` at a database you want to keep.

### Other scripts

| Location | Script | Purpose |
|---|---|---|
| `backend` | `npm run build` / `npm start` | Compile with `tsc` and run `dist/server.js` |
| `frontend` | `npm run build` | `tsc -b && vite build` |
| `frontend` | `npm run lint` | `oxlint` |

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | Signs access tokens (at least 32 characters) |
| `INTERNAL_BILLING_SECRET` | yes | Token for the internal billing endpoint (at least 32 characters) |
| `WEBHOOK_SECRET_ENCRYPTION_KEY` | yes (outside tests) | 32-byte key as 64 hex characters, used to encrypt webhook secrets |
| `FRONTEND_URL` | yes (outside tests) | Allowed CORS origin |
| `ACCESS_TOKEN_EXPIRES_IN` | no | Access token lifetime (default `15m`) |
| `REFRESH_TOKEN_EXPIRES_DAYS` | no | Refresh token lifetime in days (default `7`) |
| `PORT` | no | API port (default `3000`) |
| `API_KEY_MAX_LIFETIME_DAYS` | no | Maximum API key lifetime (default `365`) |

```env
DATABASE_URL=...
JWT_SECRET=...
INTERNAL_BILLING_SECRET=...
WEBHOOK_SECRET_ENCRYPTION_KEY=...
FRONTEND_URL=...
```

### Backend tests (`backend/.env.test`)

```env
TEST_DATABASE_URL=...   # must point to a database whose name ends in _test
JWT_SECRET=...
INTERNAL_BILLING_SECRET=...
```

### Frontend (`frontend/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the API, including `/api/v1` |

---

## Demo data

An optional seed script populates a database with realistic demo data. It uses Prisma directly, so the API does not need to be running, and it only removes its own previous demo data before recreating it.

```bash
cd backend
npx prisma migrate deploy   # migrations must be applied first
npx tsx scripts/seed-demo.ts
```

It creates:

- 8 businesses (CloudHarbor, MetricForge, TeamFlow, SecureVault, MailPilot, LedgerDesk, Supportly, DevPulse), each with a tax rate
- 40 services and 160 plans (INR, monthly and yearly), including some inactive ones
- 36 customer accounts attached to every business, and 3 admin accounts
- Roughly 150 or more subscriptions across `ACTIVE`, `PENDING`, `PAST_DUE`, scheduled-cancellation and `CANCELLED` states
- Invoices, successful and failed payments, credit ledger entries and subscription events

| Role | Email | Password |
|---|---|---|
| Admin (member of all 8 businesses) | `seed.admin@billingos.local` | `DemoPassword123!` |
| Customer | `seed.customer.01@billingos.local` to `seed.customer.36@billingos.local` | `DemoPassword123!` |

---

## API overview

All routes are served under `/api/v1`. Authenticated routes expect `Authorization: Bearer <accessToken>`. Billing mutations expect an `Idempotency-Key` header. The route files in `backend/src/modules/*/*.routes.ts` are the full reference; representative routes are listed below.

| Resource | Representative routes |
|---|---|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET` and `PATCH /auth/me` |
| **Businesses** | `POST /businesses`, `GET /businesses/my`, `GET /businesses/:id`, `PATCH /businesses/:businessId` |
| **Services** | `POST` and `GET /businesses/:businessId/services`, `GET` and `PATCH …/services/:serviceId` |
| **Plans** | `POST` and `GET /businesses/:businessId/services/:serviceId/plans`, `GET` and `PATCH …/plans/:planId` |
| **Admin read models** | `GET /businesses/:businessId/admin/dashboard`, `…/admin/customers`, `…/admin/subscriptions`, `…/admin/invoices`, `…/admin/payments`, `…/admin/billing-activity`; `POST …/admin/customers` attaches an existing customer account |
| **Catalog (customer)** | `GET /catalog` with `search`, `currency`, `interval`, `businessId` filters |
| **Subscriptions (customer)** | `POST /subscriptions`, `GET /subscriptions[/:id]`, `GET …/:id/events`, `POST …/:id/upgrade`, `…/downgrade`, `…/cancel` |
| **Invoices and payments (customer)** | `GET /invoices[/:id]`, `POST /invoices/:invoiceId/pay`, `GET /billing-activity` |
| **Credits (customer)** | `GET /credits` (balance per currency) |
| **Business-scoped billing** | `POST /businesses/:businessId/subscriptions` and `…/payments`, plus matching `GET` routes for subscriptions, invoices, payments and credits |
| **Webhooks (admin)** | `POST` and `GET /businesses/:businessId/webhooks`, `PATCH` and `DELETE …/webhooks/:endpointId` |
| **API keys (admin)** | `POST` and `GET /businesses/:businessId/api-keys`, `DELETE …/api-keys/:apiKeyId` |
| **Public API** | `GET /public/catalog` (API key bearer auth) |
| **Internal** | `POST /internal/billing/run` (`X-Internal-Token`) |
| **Health** | `GET /health` |

Response envelope:

```jsonc
// success
{ "success": true, "data": { }, "pagination": { "page": 1, "limit": 20, "hasNextPage": false } }

// failure
{ "success": false, "error": { "code": "INVOICE_ALREADY_PAID", "message": "This invoice has already been paid." } }
```

---

## Frontend

A single React SPA with React Router. `AuthInitializer` verifies the stored session through `/auth/me` on load, and route guards send each account type to its own area.

- **State and data:** TanStack Query for server state, Zustand for the auth session, and an Axios client that attaches the access token and performs a single shared refresh on `401`. A global handler shows a toast on `429` responses.
- **Public pages:** landing page, login, register (with account-type selection).
- **Onboarding and workspace (admin):** `/onboarding/create-business` and `/workspace` to create and choose a business.

**Customer portal (`/customer`)**
- Dashboard with active subscriptions, open invoices, credit, next billing date, billing overview and recent activity
- Explore catalog with search, currency and interval filters, and service detail pages
- Checkout with a live invoice preview (tax and credit applied) and the demo payment panel
- Subscriptions list and detail pages with event timeline, plan-change options and cancellation (period end or immediate)
- Invoices list and detail pages with print-to-PDF, a payment page for open invoices, billing activity timeline and profile

**Admin workspace (`/admin/:businessId`)**
- Dashboard with metrics, subscription status breakdown and recent invoices
- Services and plans management, with detail pages
- Customers, subscriptions, invoices and payments, each with list and detail views
- Business-wide billing activity timeline
- Webhooks and API keys management, business settings (name and tax rate) and profile
- Business switcher for admins who belong to several businesses

---

## Project structure

```text
backend/
  prisma/
    schema.prisma
    migrations/              # includes the invoice-number sequence and unique-name indexes
  scripts/
    seed-demo.ts             # optional demo data
  src/
    app.ts  server.ts
    config/                  # env validation, Prisma client
    middleware/              # auth, account-type, business-role, internal token, rate limits, errors
    shared/utils/            # idempotency, pagination, billing period, maintenance worker
    modules/
      auth/  businesses/  customers/
      services/  plans/  catalog/
      subscriptions/  invoices/  payments/  credits/
      billing/               # proration, tax, billing intervals, recurring billing (service + worker)
      admin/                 # admin read models
      customer-portal/       # customer-scoped endpoints
      webhooks/  api-keys/  public-api/
  tests/                     # integration suites and unit/

frontend/
  src/
    api/                     # typed API clients
    components/              # admin/, customer/, catalog/, auth/, ui/ and shared components
    hooks/  lib/  stores/    # query hooks, formatters, idempotency keys, auth store
    layouts/  routes/        # AdminLayout, CustomerLayout, route guards, router
    pages/                   # marketing, auth, onboarding, workspace, admin/, customer/
```

---

## Future extensions

- A real payment provider integration behind the existing settlement function, replacing the demo outcome selection
- Additional currencies, since currency is already modelled end to end on plans, subscriptions, invoices, payments and the credit ledger

---
