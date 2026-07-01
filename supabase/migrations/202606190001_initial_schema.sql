create extension if not exists "pgcrypto";

create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  created_at timestamp with time zone default now()
);

create table public.credit_accounts (
  user_id uuid references auth.users on delete cascade primary key,
  balance int not null default 10,
  lifetime_granted int not null default 10,
  lifetime_spent int not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint chk_credit_balance_nonnegative check (balance >= 0),
  constraint chk_credit_lifetime_nonnegative check (lifetime_granted >= 0 and lifetime_spent >= 0)
);

create trigger credit_accounts_updated_at
  before update on public.credit_accounts
  for each row execute function public.update_updated_at();

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  content_text text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create trigger resumes_updated_at
  before update on public.resumes
  for each row execute function public.update_updated_at();

create table public.jd_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  company_name text,
  job_title text not null,
  jd_text text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create trigger jd_history_updated_at
  before update on public.jd_history
  for each row execute function public.update_updated_at();

create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references public.resumes on delete set null,
  jd_id uuid references public.jd_history on delete set null,
  mode text not null,
  focus_type text,
  level text not null,
  language text not null default 'en',
  follow_up_intensity text not null default 'medium',
  interviewer_agent text not null,
  resume_text_snapshot text,
  jd_text_snapshot text,
  generic_role text,
  fit_map jsonb not null default '{}',
  question_generation_meta jsonb not null default '{}',
  status text not null default 'in_progress',
  workflow_stage text not null default 'created',
  current_chain_index int not null default 0,
  overall_score int,
  feedback_status text not null default 'pending',
  feedback_error text,
  feedback_started_at timestamp with time zone,
  feedback_retry_count int not null default 0,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default now(),
  constraint chk_session_mode check (mode in ('focused', 'full_process')),
  constraint chk_session_level check (level in ('junior', 'mid', 'senior')),
  constraint chk_follow_up_intensity check (follow_up_intensity in ('off', 'low', 'medium', 'high')),
  constraint chk_interviewer_agent check (interviewer_agent in ('hr', 'hiring_manager', 'combined')),
  constraint chk_session_status check (status in ('in_progress', 'completed', 'abandoned')),
  constraint chk_workflow_stage check (workflow_stage in ('created', 'questions_ready', 'interviewing', 'completed')),
  constraint chk_feedback_status check (feedback_status in ('pending', 'generating', 'summary_ready', 'ready', 'failed')),
  constraint chk_session_score check (overall_score is null or overall_score between 1 and 5),
  constraint chk_current_chain_index check (current_chain_index between 0 and 2)
);

create trigger interview_sessions_updated_at
  before update on public.interview_sessions
  for each row execute function public.update_updated_at();

create table public.question_chains (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.interview_sessions on delete cascade not null,
  chain_index int not null,
  main_question text not null,
  question_intent text,
  exchanges jsonb not null default '[]',
  interviewer_feedback jsonb,
  mentor_feedback jsonb,
  score int,
  created_at timestamp with time zone default now(),
  unique (session_id, chain_index),
  constraint chk_chain_index check (chain_index between 0 and 2),
  constraint chk_chain_score check (score is null or score between 1 and 5),
  constraint chk_exchanges_array check (jsonb_typeof(exchanges) = 'array')
);

create table public.user_skill_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  skill_tag text not null,
  weak_count int not null default 0,
  strong_count int not null default 0,
  last_direction text,
  last_score int,
  last_seen_at timestamp with time zone default now(),
  examples jsonb not null default '[]',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, skill_tag),
  constraint chk_skill_signal_counts check (weak_count >= 0 and strong_count >= 0),
  constraint chk_skill_last_direction check (last_direction is null or last_direction in ('weak', 'strong')),
  constraint chk_skill_last_score check (last_score is null or last_score between 1 and 5),
  constraint chk_skill_examples_array check (jsonb_typeof(examples) = 'array')
);

create trigger user_skill_signals_updated_at
  before update on public.user_skill_signals
  for each row execute function public.update_updated_at();

create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.interview_sessions on delete cascade not null unique,
  interviewer_overall jsonb,
  mentor_overall jsonb,
  overall_score int,
  created_at timestamp with time zone default now(),
  constraint chk_feedback_overall_score check (overall_score is null or overall_score between 1 and 5)
);

create table public.answer_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  chain_id uuid references public.question_chains on delete set null,
  source_session_id uuid references public.interview_sessions on delete set null,
  source_chain_id uuid references public.question_chains on delete set null,
  answer_group_id uuid not null default gen_random_uuid(),
  version_number integer not null default 1,
  question_text text not null,
  tag text not null,
  skill_tags jsonb not null default '[]',
  mastery_status text not null default 'new',
  original_answer jsonb not null,
  polished_answer jsonb,
  bank_answer jsonb not null,
  source text not null default 'original',
  saved_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint chk_answer_source check (source in ('original', 'polished')),
  constraint chk_answer_version check (version_number >= 1),
  constraint chk_answer_mastery_status check (mastery_status in ('new', 'practicing', 'stable')),
  constraint chk_answer_skill_tags_array check (jsonb_typeof(skill_tags) = 'array'),
  constraint chk_answer_tag check (tag in (
    'resume_deep_dive',
    'behavioral',
    'motivation_fit',
    'culture_collaboration',
    'situational',
    'other'
  ))
);

create trigger answer_bank_updated_at
  before update on public.answer_bank
  for each row execute function public.update_updated_at();

create table public.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  session_id uuid references public.interview_sessions on delete set null,
  answer_bank_id uuid references public.answer_bank on delete set null,
  amount int not null,
  reason text not null,
  idempotency_key text not null,
  metadata jsonb not null default '{}',
  created_at timestamp with time zone default now(),
  constraint chk_credit_ledger_amount_nonzero check (amount <> 0),
  constraint chk_credit_ledger_reason check (reason in (
    'signup_grant',
    'interview_start',
    'answer_polish',
    'feedback_regenerate',
    'refund',
    'admin_adjustment'
  )),
  unique (user_id, idempotency_key)
);

create table public.question_library (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  difficulty text not null,
  question_text text not null,
  question_intent text,
  language text not null default 'en',
  tags jsonb default '[]',
  created_at timestamp with time zone default now(),
  constraint chk_library_tags_array check (jsonb_typeof(tags) = 'array')
);

create index idx_sessions_user_created on public.interview_sessions(user_id, created_at desc);
create index idx_resumes_user_updated on public.resumes(user_id, updated_at desc);
create index idx_jd_history_user_updated on public.jd_history(user_id, updated_at desc);
create index idx_chains_session on public.question_chains(session_id, chain_index);
create index idx_feedback_session on public.session_feedback(session_id);
create index idx_bank_user_tag on public.answer_bank(user_id, tag);
create index idx_bank_user_mastery on public.answer_bank(user_id, mastery_status);
create index idx_bank_user_saved on public.answer_bank(user_id, saved_at desc);
create index idx_bank_user_group_version on public.answer_bank(user_id, answer_group_id, version_number desc);
create unique index idx_bank_group_version_unique on public.answer_bank(answer_group_id, version_number);
create unique index idx_bank_original_chain_unique
  on public.answer_bank(user_id, chain_id)
  where source = 'original' and chain_id is not null;
create index idx_library_category_difficulty on public.question_library(category, difficulty);
create index idx_skill_signals_user_seen on public.user_skill_signals(user_id, last_seen_at desc);
create index idx_credit_ledger_user_created on public.credit_ledger(user_id, created_at desc);
create index idx_credit_ledger_session on public.credit_ledger(session_id);

alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.jd_history enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.question_chains enable row level security;
alter table public.user_skill_signals enable row level security;
alter table public.session_feedback enable row level security;
alter table public.answer_bank enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.question_library enable row level security;

create policy "users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "users can update own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can access own resumes"
  on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can access own jd history"
  on public.jd_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can access own sessions"
  on public.interview_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can access own question chains"
  on public.question_chains for all
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = question_chains.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = question_chains.session_id and s.user_id = auth.uid()
    )
  );

create policy "users can read own skill signals"
  on public.user_skill_signals for select using (auth.uid() = user_id);

create policy "users can access own session feedback"
  on public.session_feedback for all
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = session_feedback.session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = session_feedback.session_id and s.user_id = auth.uid()
    )
  );

create policy "users can access own answer bank"
  on public.answer_bank for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users can read own credit account"
  on public.credit_accounts for select using (auth.uid() = user_id);
create policy "users can read own credit ledger"
  on public.credit_ledger for select using (auth.uid() = user_id);

create policy "authenticated users can read question library"
  on public.question_library for select using (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;

  insert into public.credit_accounts (user_id, balance, lifetime_granted, lifetime_spent)
  values (new.id, 10, 10, 0)
  on conflict (user_id) do nothing;

  insert into public.credit_ledger (user_id, amount, reason, idempotency_key, metadata)
  values (new.id, 10, 'signup_grant', 'signup_grant:' || new.id::text, '{"source":"signup"}')
  on conflict (user_id, idempotency_key) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.spend_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_idempotency_key text,
  p_session_id uuid default null,
  p_answer_bank_id uuid default null,
  p_metadata jsonb default '{}'
)
returns public.credit_ledger
security definer
set search_path = public
language plpgsql
as $$
declare
  existing public.credit_ledger;
  account public.credit_accounts;
  ledger_row public.credit_ledger;
begin
  if p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select * into existing
  from public.credit_ledger
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    return existing;
  end if;

  select * into account
  from public.credit_accounts
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'credit_account_missing';
  end if;

  if account.balance < p_amount then
    raise exception 'insufficient_credits';
  end if;

  update public.credit_accounts
  set balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount
  where user_id = p_user_id;

  insert into public.credit_ledger (
    user_id,
    session_id,
    answer_bank_id,
    amount,
    reason,
    idempotency_key,
    metadata
  )
  values (
    p_user_id,
    p_session_id,
    p_answer_bank_id,
    -p_amount,
    p_reason,
    p_idempotency_key,
    p_metadata
  )
  returning * into ledger_row;

  return ledger_row;
end;
$$;

create or replace function public.grant_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text,
  p_idempotency_key text,
  p_session_id uuid default null,
  p_answer_bank_id uuid default null,
  p_metadata jsonb default '{}'
)
returns public.credit_ledger
security definer
set search_path = public
language plpgsql
as $$
declare
  existing public.credit_ledger;
  ledger_row public.credit_ledger;
begin
  if p_amount <= 0 then
    raise exception 'amount_must_be_positive';
  end if;

  select * into existing
  from public.credit_ledger
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    return existing;
  end if;

  update public.credit_accounts
  set balance = balance + p_amount,
      lifetime_granted = lifetime_granted + p_amount
  where user_id = p_user_id;

  insert into public.credit_ledger (
    user_id,
    session_id,
    answer_bank_id,
    amount,
    reason,
    idempotency_key,
    metadata
  )
  values (
    p_user_id,
    p_session_id,
    p_answer_bank_id,
    p_amount,
    p_reason,
    p_idempotency_key,
    p_metadata
  )
  returning * into ledger_row;

  return ledger_row;
end;
$$;
