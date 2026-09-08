# Test setup

This suite intentionally uses a **separate PostgreSQL database**.

Create `.env.test` in the project root:

```env
TEST_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/saas_billing_test"
JWT_SECRET="a-long-test-only-secret"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS="7"
```

Do **not** point `TEST_DATABASE_URL` at your development database.

Run the existing migrations against the test database:

```bash
npx prisma migrate deploy
```

Then run:

```bash
npx vitest run
```

or:

```bash
npx vitest
```

The test setup truncates all application tables before every test. This is deliberate: every test starts from a known state.

## Production-level behavior

The suite tests both API behavior and database invariants.

Some tests use `it.fails(...)`. These are **known defect detectors**: the test is expected to fail with the current implementation because the implementation currently violates the security/reliability invariant being tested.

Current expected defect detectors include:

1. Cross-tenant read access to services/plans.
2. Unprotected internal recurring-billing trigger.
3. Concurrent recurring-billing execution creating duplicate renewal invoices.

When those project bugs are fixed, the corresponding `it.fails` tests should be changed to normal `it(...)` tests.

## Package scripts

If your `package.json` does not already have them, add:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

No HTTP testing dependency is required: the suite uses Node's built-in `fetch` and starts the real Express app on an ephemeral local port.
