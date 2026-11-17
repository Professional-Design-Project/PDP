# Supabase setup

ensaio runs in two modes:

- **Without Supabase** (default). Leave the Supabase variables empty. There are no accounts, and the backend stores data in the local SQLite file `backend/data/voicebot.sqlite3`.
- **With Supabase.** Sign-in is required to practise, and sessions, transcripts, feedback and consents are stored in Supabase Postgres with row level security.

## 1. Create the project

1. Create a project at https://supabase.com/dashboard. Choose an EU region.
2. In **Authentication → URL Configuration**, set:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** add `http://localhost:3000/auth/callback`
3. Keep **Authentication → Sign In / Providers → Email** on, with "Confirm email" enabled and a minimum password length of 8.

## 2. Apply the schema

```
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push --remote
```

Run these commands in a regular terminal: `login` opens the browser and `link` asks for the database password.

`db push --remote` applies `supabase/migrations/` to the linked project. It creates `profiles`, `consents`, `practice_sessions` and `session_events`, enables RLS on all of them and adds a trigger that creates a profile for every new user.

## 3. Fill in the environment

`frontend/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`backend/.env`:

```
VOICEBOT_SUPABASE_URL=https://<project-ref>.supabase.co
VOICEBOT_DATABASE_URL=postgresql://...      # Connect → Session pooler; replace [YOUR-PASSWORD]
VOICEBOT_SUPABASE_SECRET_KEY=sb_secret_...  # only used to delete accounts
```

The publishable key is safe in the browser. Never put the secret key or the database URL in the frontend.

Restart both servers after changing the environment.

## How access works

| Data | Written by | Readable by |
|---|---|---|
| `practice_sessions` | backend | the owner, only public columns (no instructions, context or token hash) |
| `session_events` | backend | the owner, only `transcript.final` and `feedback.created` |
| `consents` | backend, when a session starts | the owner, who can also withdraw them |
| `profiles` | trigger on sign-up | the owner, who can change `locale` |

The backend connects to Postgres directly and verifies user access tokens against the project's JWKS (`/auth/v1/.well-known/jwks.json`, ES256 or RS256). The project must use asymmetric JWT signing keys, which is the default for new projects.

## Tests

Backend tests can run the migrations against a disposable Postgres server:

```
VOICEBOT_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:54329/postgres uv run pytest
```

`backend/tests/supabase_stub.sql` stands in for the Supabase `auth` schema and roles. Without the variable, the Postgres test is skipped.
