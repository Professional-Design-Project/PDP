create table private.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

revoke all on private.admins from public, anon, authenticated;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.admins where user_id = (select auth.uid()))
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text default (auth.jwt() ->> 'email'),
  kind text not null check (kind in ('bug', 'idea', 'other')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_reports_user_id_idx on public.feedback_reports (user_id);
create index feedback_reports_status_created_at_idx
  on public.feedback_reports (status, created_at desc);

alter table public.feedback_reports enable row level security;

revoke all on public.feedback_reports from anon, authenticated;
grant select, delete on public.feedback_reports to authenticated;
grant insert (kind, message) on public.feedback_reports to authenticated;
grant update (status) on public.feedback_reports to authenticated;

create policy "reports can be sent by signed-in users"
  on public.feedback_reports for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'new'
  );

create policy "reports are readable by their author and by admins"
  on public.feedback_reports for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

create policy "report status can be changed by admins"
  on public.feedback_reports for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "reports can be deleted by admins"
  on public.feedback_reports for delete
  to authenticated
  using ((select public.is_admin()));

create function private.touch_feedback_report()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function private.touch_feedback_report() from public, anon, authenticated;

create trigger feedback_reports_touch
  before update on public.feedback_reports
  for each row execute function private.touch_feedback_report();

create function private.limit_feedback_reports()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*) from public.feedback_reports
    where user_id = new.user_id and created_at > now() - interval '1 hour'
  ) >= 10 then
    raise exception 'too many reports, try again later';
  end if;
  return new;
end;
$$;

revoke execute on function private.limit_feedback_reports() from public, anon, authenticated;

create trigger feedback_reports_limit
  before insert on public.feedback_reports
  for each row execute function private.limit_feedback_reports();
