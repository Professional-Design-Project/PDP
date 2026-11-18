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

`db push --remote` applies `supabase/migrations/` to the linked project. It creates `profiles`, `consents`, `practice_sessions`, `session_events` and `feedback_reports`, enables RLS on all of them and adds a trigger that creates a profile for every new user.

### Admins

Signed-in users send problems and ideas on `/report`. Admins read them and change their status on `/admin`. Admins are listed in `private.admins`, which the API cannot read or change. To make someone an admin, run this in **SQL Editor** after they have signed in once:

```sql
insert into private.admins (user_id)
select id from auth.users where email = 'admin@example.com';
```

To remove an admin, delete their row from `private.admins`.

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

## 4. Sign in with Google and GitHub (optional)

The login and signup pages always show "Continue with Google" and "Continue with GitHub". Each button works only after its provider is turned on in Supabase. The client secrets stay in the Supabase dashboard. Never put them in the repo or in an environment file.

Both providers send the user back to the same Supabase URL: `https://<project-ref>.supabase.co/auth/v1/callback`. Supabase then sends the user to `/auth/callback` in the app, which must be in the Redirect URLs from step 1.

### GitHub

1. On GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Set **Homepage URL** to `http://localhost:3000` and **Authorization callback URL** to the Supabase callback above. Leave **Enable Device Flow** off.
3. Copy the **Client ID** and generate a **Client secret**.
4. In Supabase, open **Authentication → Sign In / Providers → GitHub**, turn it on and paste both values.

### Google

1. Create a project at https://console.cloud.google.com.
2. In **Google Auth Platform → Branding**, set the app name, the support email and the developer contact email.
3. In **Audience**, choose **External**. While the app is in testing mode, add every Google account that should be able to sign in under **Test users**.
4. In **Clients → Create client**, choose **Web application** and set:
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** the Supabase callback above
5. In Supabase, open **Authentication → Sign In / Providers → Google**, turn it on and paste the client ID and secret.

A new Google client can take a few minutes to start working.

### Going live

When the app gets a public domain:

- Add `https://<domain>/auth/callback` to the Supabase Redirect URLs and set the Site URL to `https://<domain>`.
- Add `https://<domain>` to the Google **Authorized JavaScript origins**, set the privacy policy link in **Branding** to `https://<domain>/en/privacy`, and publish the app in **Audience** so that any Google account can sign in.
- Set the GitHub OAuth App **Homepage URL** to `https://<domain>`.

## How access works

| Data | Written by | Readable by |
|---|---|---|
| `practice_sessions` | backend | the owner, only public columns and the context they typed (no instructions or token hash). The owner can delete a finished session, which also deletes its events |
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
