# Admin + Customer Demo Seed

This seed is designed for the current SaaS Billing Platform backend after the planned User.name and customer-context fixes are applied.

## What it creates

- 3 businesses: CloudBox Demo, NovaStack Demo, LedgerPro Demo
- One primary admin who owns all 3 businesses
- One hybrid user who is admin + customer
- One customer who belongs to all 3 businesses
- One team admin who is a member of two businesses
- 7 additional customer accounts
- 6 services x 3 plans per business
- active subscriptions and successful payments
- upgrade history
- scheduled downgrade
- immediate and period-end cancellation states
- failed initial payment / pending subscription
- failed renewal / past-due subscription
- credit ledger entries
- inactive services and plans for admin filters/status badges
- webhook endpoints with active + disabled states
- API keys with active + revoked states

## Run

From the backend directory:

```bash
npx tsx scripts/seed-admin-demo.ts
```

The script starts the existing Express app on a temporary local port, calls the real API for business/service/plan/subscription/payment flows, and uses Prisma only for relationships and demo-only admin configuration that has no need to go through a public customer flow.

It deletes only the deterministic demo business names and demo email addresses before reseeding.

## Demo credentials

Password for all demo accounts:

```text
DemoPassword123!
```

Primary admin:
```text
demo.admin@saasbilling.local
```

Hybrid admin + customer:
```text
demo.hybrid@saasbilling.local
```

Customer:
```text
demo.customer@saasbilling.local
```

Second admin:
```text
demo.teamadmin@saasbilling.local
```
