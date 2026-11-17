grant delete on public.practice_sessions to authenticated;

create policy "finished practice sessions can be deleted by their owner"
  on public.practice_sessions for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    and status not in ('connecting', 'active')
  );
