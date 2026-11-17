create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'pl' check (locale in ('pl', 'en')),
  created_at timestamptz not null default now()
);

create table public.consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  language text not null check (language in ('pl', 'en')),
  voice boolean not null,
  transcripts boolean not null,
  improvement boolean not null default false,
  outside_eu boolean not null,
  given_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check (withdrawn_at is null or withdrawn_at >= given_at)
);

create index consents_user_id_given_at_idx on public.consents (user_id, given_at desc);

create table public.practice_sessions (
  id uuid primary key,
  user_id uuid references auth.users (id) on delete cascade,
  scenario_id text not null,
  scenario_version integer not null check (scenario_version > 0),
  language text not null check (language in ('pl', 'en')),
  profile text not null,
  model text not null,
  status text not null check (status in ('created', 'connecting', 'active', 'ended', 'failed')),
  created_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  end_reason text,
  context text not null default '',
  instructions text not null,
  token_hash text not null,
  consent jsonb
);

create index practice_sessions_user_id_created_at_idx
  on public.practice_sessions (user_id, created_at desc);

create index practice_sessions_unfinished_idx
  on public.practice_sessions (status)
  where status not in ('ended', 'failed');

create table public.session_events (
  sequence bigint generated always as identity primary key,
  session_id uuid not null references public.practice_sessions (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb
);

create index session_events_session_id_sequence_idx
  on public.session_events (session_id, sequence);

alter table public.profiles enable row level security;
alter table public.consents enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.session_events enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on public.consents from anon, authenticated;
revoke all on public.practice_sessions from anon, authenticated;
revoke all on public.session_events from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (locale) on public.profiles to authenticated;
grant select on public.consents to authenticated;
grant update (withdrawn_at) on public.consents to authenticated;
grant select (id, user_id, scenario_id, language, status, created_at, started_at, ended_at, end_reason)
  on public.practice_sessions to authenticated;
grant select (sequence, session_id, kind, created_at, data)
  on public.session_events to authenticated;

create policy "profiles are readable by their owner"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles are editable by their owner"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "consents are readable by their owner"
  on public.consents for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "active consents can be withdrawn by their owner"
  on public.consents for update
  to authenticated
  using ((select auth.uid()) = user_id and withdrawn_at is null)
  with check ((select auth.uid()) = user_id);

create policy "practice sessions are readable by their owner"
  on public.practice_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "transcripts and feedback are readable by the session owner"
  on public.session_events for select
  to authenticated
  using (
    kind in ('transcript.final', 'feedback.created')
    and exists (
      select 1
      from public.practice_sessions sessions
      where sessions.id = session_id
        and sessions.user_id = (select auth.uid())
    )
  );

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
