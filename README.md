# ChartSense

An AI second opinion on your chart. Traders upload a chart screenshot and get a plain-English
breakdown of structure, key levels, verdict, reasoning and invalidation.

> Every output is an AI-generated prediction, not a guarantee and not financial advice. The
> product never claims an accuracy percentage.

## Status

| Milestone                                     | State   |
| --------------------------------------------- | ------- |
| M1 — Foundation (auth, terms gate, dashboard) | ✅ Done |
| M2 — Upload & storage                         | Next    |
| M3 — AI pipeline                              | —       |
| M4 — Results UI                               | —       |
| M5 — Payments                                 | —       |
| M6 — History, sharing, outcomes, reports      | —       |
| M7 — Admin                                    | —       |
| M8 — Launch prep                              | —       |

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS v4 + shadcn/ui · PostgreSQL ·
Prisma 7 · Auth.js v5 (Google + email magic link, database sessions) · Zod · Vitest.

## Getting started

Requirements: Node 20.9+ (22 recommended), Docker (or any local Postgres 16).

```bash
npm install
```

```bash
docker compose up -d
```

```bash
cp .env.example .env
```

Fill in `AUTH_SECRET` (`npx auth secret`) and `IP_HASH_SALT` (any random string). Everything
else has working local defaults.

```bash
npm run db:migrate
```

```bash
npm run dev
```

Open http://localhost:3000 → **Analyze a chart** → enter any email. With
`EMAIL_TRANSPORT=console` (the local default) the magic link is **printed in the terminal**
running `npm run dev`. Open it, go through the 3 intro slides, tick the box, and you land on the
dashboard with 1 free credit.

To sign in with Google locally, create an OAuth client (Web application) in Google Cloud Console
with redirect URI `http://localhost:3000/api/auth/callback/google`, then set `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET`. The Google button only appears when both are set.

To make yourself an admin, add your email to `ADMIN_EMAILS` (promoted on next sign-in) or run
`npm run db:seed`.

## Scripts

| Script                            | What it does                           |
| --------------------------------- | -------------------------------------- |
| `npm run dev`                     | Dev server                             |
| `npm run build` / `npm start`     | Production build / serve               |
| `npm run lint`                    | ESLint                                 |
| `npm run typecheck`               | Generate route types + `tsc --noEmit`  |
| `npm run format` / `format:check` | Prettier (with Tailwind class sorting) |
| `npm test`                        | Vitest (unit + DB integration tests)   |
| `npm run db:migrate`              | Create/apply migrations in dev         |
| `npm run db:deploy`               | Apply migrations in CI/production      |
| `npm run db:seed`                 | Upsert `ADMIN_EMAILS` users as admins  |
| `npm run db:studio`               | Prisma Studio                          |

Integration tests (`tests/integration`) run against `TEST_DATABASE_URL`, falling back to
`DATABASE_URL`, and are skipped if neither is set. They create users with
`@integration.test` emails and delete them afterwards.

A pre-commit hook (husky + lint-staged) runs ESLint and Prettier on staged files. CI
(`.github/workflows/ci.yml`) runs migrations, lint, typecheck, format check, tests and build
against a Postgres service.

## Environment variables

All variables are validated at startup in `src/server/env.schema.ts`. See `.env.example` for the
full annotated list. Variables for later milestones are optional until their feature ships.

| Variable                                | Required          | Notes                                                            |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                          | yes               | Pooled Postgres URL                                              |
| `DIRECT_URL`                            | Neon              | Direct URL for migrations                                        |
| `AUTH_SECRET`                           | yes               | ≥ 32 chars                                                       |
| `NEXT_PUBLIC_APP_URL`                   | yes               | Public base URL                                                  |
| `APP_ENV`                               | no                | `development`/`preview`/`production`; falls back to `VERCEL_ENV` |
| `IP_HASH_SALT`                          | yes               | Salt for hashed IPs                                              |
| `ADMIN_EMAILS`                          | no                | Comma-separated                                                  |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | no (both or none) | Enables Google sign-in                                           |
| `EMAIL_TRANSPORT`                       | no                | `console` (local default) or `resend` (deployed default)         |
| `RESEND_API_KEY`, `EMAIL_FROM`          | when `resend`     |                                                                  |
| `FREE_SIGNUP_CREDITS`                   | no                | Default `1`                                                      |
| `FEATURE_FREE_CREDIT`                   | no                | Default `true`                                                   |
| `FEATURE_SHARE_LINKS`                   | no                | Default `true`                                                   |
| `FEATURE_TRADE_LEVELS`                  | no                | Default `false`. **Keep off in production** pending SEBI review  |

Production guards: when `APP_ENV=production`, the console email transport is rejected and a
warning is logged if `FEATURE_TRADE_LEVELS=true`.

## Project structure

```
prisma/                 schema, migrations, seed
prompts/                versioned AI prompts (M3)
tests/                  unit, integration, e2e, fixtures
src/
  app/                  routes only (thin)
    (marketing)/        public pages
    (auth)/login        sign-in + "check your email"
    onboarding/         intro slides + terms acceptance
    app/                authenticated area (layout = auth + terms gate)
    api/                route handlers
  features/<name>/      feature modules: components/, server/ (business logic)
  components/           shared UI (ui/ = shadcn primitives, layout/)
  server/               shared infrastructure: env, config/flags, db, auth, http, errors
  lib/                  pure helpers usable on client and server (legal copy, utils)
  generated/prisma/     Prisma client (generated, git-ignored)
```

Conventions: business logic lives in `features/*/server/*.service.ts`, never in route handlers.
Every API error has the shape `{ error: { code, message } }` (see `src/server/errors.ts`), and
state-changing API routes reject cross-origin requests (`src/server/http.ts`).

## Key invariants

- **Credits ledger is append-only.** `appendLedgerEntry` is the only way credits change. It writes
  a ledger row and updates the cached `User.creditBalance` in one transaction. A guarded update
  makes a negative balance impossible, and `@@unique([reason, referenceId])` makes every grant or
  debit idempotent, including under concurrent requests (covered by integration tests).
- **Terms gate.** `/app/*` requires a session **and** acceptance of the current `TERMS_VERSION`
  (`src/lib/legal.ts`). Bumping that constant sends every user back through acceptance. Each
  acceptance is stored in `TermsAcceptance` with time, version, hashed IP and user agent.
- **Free credit** is granted on first terms acceptance (not at account creation), so credits
  are only given after the user agrees to the risk terms. Disposable email domains are blocked
  at sign-in.
- **The session is not trusted for authorization data.** `getCurrentUser()` re-reads role,
  deletion state and terms from the database on every request.

## Deploy to Render (staging)

Staging runs on Render's free `https://<name>.onrender.com` address, defined in `render.yaml`
(a Render Blueprint). Database: Neon (free tier does not expire, unlike Render's free Postgres).

**Free-plan caveats:** the service sleeps after 15 minutes idle (first request then takes ~1
minute), and builds/instances have 512 MB RAM. Upgrade to the Starter plan before real users.

### 1. Database (Neon)

1. Create a project at neon.tech, region **AWS Asia Pacific (Singapore)**.
2. Copy the connection string with **"Connection pooling" turned OFF** (host without `-pooler`).
   Render runs one long-lived server, so a direct connection is simplest. It looks like
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`.

### 2. Email (Resend test sender)

1. Sign up at resend.com and create an API key.
2. The test sender `onboarding@resend.dev` (already set in `render.yaml`) **only delivers to the
   email address of your Resend account**, so sign in to staging with that address. Sending to
   other people requires verifying your own domain (M8).

### 3. Create the service

1. Render dashboard → **New → Blueprint** → connect GitHub → select this repo.
2. Fill in the prompted values:
   - `DATABASE_URL`: the Neon string from step 1
   - `RESEND_API_KEY`: from step 2
   - `ADMIN_EMAILS`: your email (same as your Resend account email)
3. `AUTH_SECRET` and `IP_HASH_SALT` are generated by Render; the public URL comes from Render's
   `RENDER_EXTERNAL_URL` automatically.
4. Apply. The first build installs, runs `prisma migrate deploy`, builds, then health-checks
   `/api/health`.

Every push to the configured branch redeploys automatically. Migrations run during the build
(Render's pre-deploy command requires a paid plan).

### 4. Google sign-in (later)

Create an OAuth client in Google Cloud Console with redirect URI
`https://<name>.onrender.com/api/auth/callback/google`, then add `AUTH_GOOGLE_ID` and
`AUTH_GOOGLE_SECRET` in the Render service's Environment tab.

### Troubleshooting

- **Deploy fails at "Invalid environment variables"**: the log lists exactly which setting is
  missing or malformed.
- **Health check fails**: usually a wrong `DATABASE_URL`; check `sslmode=require` is present.
- **"We couldn't send your sign-in email"**: wrong `RESEND_API_KEY`, or you used an address other
  than your Resend account email with the test sender. The Render log shows the Resend error.

Production (real domain, Razorpay live keys, `APP_ENV=production`) is covered in M8.
