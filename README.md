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

## Checks

From the repository root:

```
cd backend && uv run ruff check && uv run pytest
cd frontend && corepack pnpm typecheck && corepack pnpm lint && corepack pnpm test
```

## Repository

| Path | Contents |
|---|---|
| `backend/` | API, voice pipeline, storage and authentication |
| `frontend/` | Web application |
| `supabase/` | Database migrations and Supabase configuration |
| `docs/` | Legal documents |
