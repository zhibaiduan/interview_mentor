grant usage on schema public to anon, authenticated, service_role;

grant select, update on public.profiles to authenticated;

grant select, insert, update, delete on public.resumes to authenticated;
grant select, insert, update, delete on public.jd_history to authenticated;
grant select, insert, update, delete on public.interview_sessions to authenticated;
grant select, insert, update, delete on public.question_chains to authenticated;
grant select, insert, update, delete on public.session_feedback to authenticated;
grant select, insert, update, delete on public.answer_bank to authenticated;

grant select on public.user_skill_signals to authenticated;
grant select on public.credit_accounts to authenticated;
grant select on public.credit_ledger to authenticated;
grant select on public.question_library to authenticated;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

revoke execute on function public.spend_credits(uuid, integer, text, text, uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke execute on function public.grant_credits(uuid, integer, text, text, uuid, uuid, jsonb)
  from public, anon, authenticated;

grant execute on function public.spend_credits(uuid, integer, text, text, uuid, uuid, jsonb)
  to service_role;
grant execute on function public.grant_credits(uuid, integer, text, text, uuid, uuid, jsonb)
  to service_role;
