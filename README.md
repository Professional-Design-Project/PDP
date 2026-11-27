# ensaio

ensaio is a voice practice partner for job interviews, thesis defences and oral exams. The user talks to an AI interviewer in real time and gets a transcript and written feedback after the session.

## Stack

| Part | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, `@supabase/ssr` |
| Backend | Python 3.12, FastAPI, Pipecat (WebRTC) |
| AI | Gemini Live for the conversation, Gemini Flash for feedback |
| Data and accounts | Supabase (Postgres with RLS, Auth), or local SQLite without accounts |
| Tooling | uv, Ruff, pytest, pnpm, oxlint, oxfmt, Vitest |

## Requirements

- Node.js 22.13 or later, with Corepack enabled
- Python 3.12 and [uv](https://docs.astral.sh/uv/)
- A Google AI Studio API key
- Optional: a Supabase project, for accounts and session history

## Setup

1. Install the dependencies, from the repository root:

   ```
   cd backend && uv sync
   cd frontend && corepack pnpm install
   ```

2. Copy the example environment files and fill them in:

   - `backend/.env.example` to `backend/.env`. `VOICEBOT_GOOGLE_API_KEY` is required.
   - `frontend/.env.example` to `frontend/.env.local`.

3. Start both servers, each in its own terminal from the repository root:

   ```
   cd backend && uv run voicebot
   cd frontend && corepack pnpm dev
   ```

4. Open http://localhost:3000.

## Modes

- **Local.** Leave the Supabase variables empty. There are no accounts, and the backend stores data in `backend/data/voicebot.sqlite3`.
- **Supabase.** Set the Supabase variables in both environment files. Sign-in is required to practise, and sessions, transcripts, feedback and consents are stored in Supabase. See [supabase/README.md](supabase/README.md) for the project setup.

The current voice integration and ongoing architecture work are described in
[docs/voice-architecture.md](docs/voice-architecture.md). The implemented
engines are Gemini Live and a cascaded ElevenLabs/OpenRouter pipeline; the
latter still requires provider-backed end-to-end verification.

### What each person needs

| Who | What they need |
|---|---|
| A user of the app | Nothing. They sign in with email, Google or GitHub on the website. |
| A developer on the team's Supabase project | The project URL and the publishable key from the project owner, put in `frontend/.env.local`, and the backend values in `backend/.env`. Email, Google and GitHub sign-in then work on `http://localhost:3000` with no extra setup, because the OAuth secrets are stored in Supabase, not in the repo. |
| A developer with their own Supabase project | Everything in [supabase/README.md](supabase/README.md), including their own Google and GitHub OAuth apps if they want those buttons to work. |

While the Google app is in testing mode, only the Google accounts listed as test users can sign in with Google. Ask the project owner to add yours.

## Checks

From the repository root:

```
cd backend && uv run ruff check && uv run pytest
cd frontend && corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test
```

The Postgres tests run only when `VOICEBOT_TEST_DATABASE_URL` points to a disposable Postgres server, for example:

```
docker run -d --rm --name ensaio-pg-test -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:17
VOICEBOT_TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/postgres uv run pytest
```

The end-to-end tests use Playwright. They build the frontend in local mode, start it on port 3100 and mock the backend, so they need no servers and no Supabase project:

```
cd frontend && corepack pnpm exec playwright install chromium
cd frontend && corepack pnpm e2e
```

GitHub Actions (`.github/workflows/ci.yml`) runs all checks, the Postgres tests, the frontend build and the end-to-end tests on every pull request and on every push to `main`.

## Repository

| Path | Contents |
|---|---|
| `backend/` | API, voice pipeline, storage and authentication |
| `frontend/` | Web application |
| `supabase/` | Database migrations and Supabase configuration |
| `docs/` | Legal documents |
