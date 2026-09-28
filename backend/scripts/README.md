
# Subvia large demo seed

This seed uses Prisma directly and matches the current schema. It does not start Express or call the HTTP API, so it is not affected by route/auth changes in the frontend or API layer.

## What it creates

- 8 realistic SaaS businesses
- 40 services (5 per business)
- 160 plans (4 per service)
- 36 customer accounts
- 1 primary admin + 2 multi-business admin accounts
- many customer-business relationships
- roughly 150+ subscriptions
- PAID, FAILED/PENDING, PERIOD_END cancellation, CANCELLED, and PAST_DUE states
- invoices and invoice items
- successful and failed demo payments
- subscription event history
- INR pricing and realistic tax rates
- customer credits
- active/inactive services and plans
- webhook endpoints
- API keys

## Demo credentials

All demo users use:

`DemoPassword123!`

Primary admin:

`seed.admin@billingos.local`

First customer:

`seed.customer.01@billingos.local`

Other customers use `seed.customer.02@billingos.local` through `seed.customer.36@billingos.local`.

## Run

From `D:\saas-billing-platform\backend`:

```powershell
npx tsx scripts/seed-demo.ts
```

The seed is deterministic by business/email names and removes only its own previous demo data before recreating it.

## Important

Run migrations first:

```powershell
npx prisma migrate deploy
npx prisma generate
```

