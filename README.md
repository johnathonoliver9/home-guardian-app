# Home Guardian starter

A Next.js + Supabase + Stripe foundation for paid homeowner membership, guided maintenance onboarding, and scheduled reminder records.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill values.
3. Run `supabase/schema.sql` in the Supabase SQL editor.
4. Configure Stripe webhook endpoint `/api/stripe/webhook` for `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
5. Run `npm run dev`.
6. Schedule `GET /api/cron/reminders` daily using a scheduler, with `Authorization: Bearer <CRON_SECRET>`.

## Scope
- Authenticated Supabase sessions via bearer access token in API requests.
- Checkout and subscription status synced by Stripe webhook.
- Guided setup builds recommended maintenance reminders.
- Due reminders recorded in notification inbox; email/push delivery is a future integration.
- Repair request submission requires an active paid membership and is protected in the database.

This starter requires your own Supabase/Stripe credentials and deployment to process real payments. Do not expose service-role or Stripe secret keys to the browser.

## Exclusive contractor assignments (1,500-member readiness)
1. Run `supabase/exclusive_contractors.sql` after the base schema.
2. Admin provisions contractor rows with `approved=true`, `trade`, and `service_area` (server-side only).
3. Homeowner request POST now requires `service_area` as well as trade and description. Update the frontend form to send the homeowner's verified service area.
4. Contractors call `GET /api/contractor/opportunities` with a Supabase bearer token, then `POST /api/contractor/claim` with `{ "requestId": 123 }`.
5. Only the homeowner and assigned contractor can access `GET/POST /api/requests/123/messages`.
6. The database's assignment primary key and atomic claim RPC prevent simultaneous double claims. Admin reassignment requires a separate audited server workflow (not included).

### Capacity notes
Designed for 1,500 registered members, **not load-tested or production certified**. Use managed Postgres connection pooling, indexes, pagination, queue-based reminders, Stripe webhook idempotency, rate limits, monitoring, and concurrency/load testing before launch. The existing daily reminders route should be refactored to batch work for larger populations. Add authenticated admin approval, more granular service-area matching, abuse protection, and homeowner notification delivery before production.

## Management dashboard add-on
Visit `/admin` after setting up Supabase and applying `schema.sql`, `exclusive_contractors.sql`, and `secure_reassignment.sql` in that order.
Add administrator user IDs to `home_guardian_admins` using a privileged SQL editor.
The dashboard supports aggregate membership metrics, paginated contractor approvals, paginated work orders, and reopen-and-notify using the existing locked database function.
**Development authentication:** `/admin` currently accepts a Supabase user access token entered manually; it is NOT a production-ready login flow. Only server-side admin-verified endpoints access the service-role database client. Replace this with secure session authentication before launch.
Contractor alerts are **in-app records only**, not delivered email/push. No deployment, load test, or security audit was executed. See `tests/admin-security-checklist.md`.

## Secure operations extension
Apply `supabase/operations_security.sql` after the earlier migrations.
- Assignment history: `GET /api/admin/history`
- Audit history: `GET /api/admin/audit`
- Message reads: transactional, assignment-checked RPC; no direct two-query TOCTOU authorization
- Approvals and reopens: transactional audit events
- Job reopened: outbox events are created atomically; `/api/cron/deliver` delivers via Resend with retries, leased workers and idempotency keys
- Configure `RESEND_API_KEY`, verified `NOTIFICATION_FROM_EMAIL`, `CRON_SECRET`, Supabase credentials, and appropriate hosting plan for the five-minute cron.
- Test: `npm install`, `npm run typecheck`, then `TEST_DATABASE_URL=... npm run test:concurrency` against **disposable seeded test data only**. Tests are skipped when no database URL exists.
- The existing `/admin` page still uses manual access-token entry and is NOT suitable for production. Complete real admin login, webhook/replay monitoring, rate limiting, and provider delivery validation before accepting customers.
- Provider acceptance of an email is not proof of inbox delivery. Configure provider webhook delivery/bounce reporting before production.

## Integrated administrator dashboard
`/admin` now uses Supabase email/password authentication and auto-refreshing sessions, rather than manually pasted tokens. Membership statistics, contractor approvals, work orders, assignment history, and administrator audit logs appear together. Admin access is verified on every API call using `home_guardian_admins`. Configure MFA and session hardening before production.

## Staging test procedure
1. Create a separate Supabase staging project. Apply migrations in README order and seed synthetic members, two matching approved contractors, and an admin account.
2. Set the staging environment variables, never production secrets. Run `npm install && npm run typecheck && npm run build`.
3. Set `TEST_DATABASE_URL` to a **disposable staging** Postgres database, then run `npm run test:concurrency`. The concurrency test creates and deletes its own work order but depends on seeded users.
4. Set `STAGING_URL` and `STAGING_BEARER_TOKEN` to a staging administrator session; run `npm run test:staging-load`. This sends 1,500 total dashboard requests at 30 concurrency, NOT 1,500 concurrent members. Test real user journeys separately.
5. Verify authorization failures, stale sessions, reassignment message reads, retry delivery, and audit entries manually or with additional end-to-end tests.

No staging credentials were available in the build environment, so staging tests and live deployment have not been run.
