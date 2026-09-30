create table public.wellness_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mood smallint not null check (mood between 1 and 10),
  sleep_hours text not null check (sleep_hours in ('Menos de 4', '4', '5', '6', '7', '8', '9+')),
  stress_level smallint not null check (stress_level between 1 and 5),
  anxiety_level smallint not null check (anxiety_level between 1 and 5),
  created_at timestamptz not null default now()
);

create table public.wellness_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null check (
    jsonb_typeof(answers) = 'array'
    and jsonb_array_length(answers) = 6
  ),
  score smallint not null check (score between 0 and 18),
  risk_level text not null check (risk_level in ('Bajo', 'Moderado', 'Alto')),
  created_at timestamptz not null default now()
);

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) between 3 and 320),
  availability text not null check (char_length(availability) between 1 and 500),
  message text not null default '' check (char_length(message) <= 2000),
  modality text not null check (modality in ('virtual', 'presencial')),
  created_at timestamptz not null default now()
);

create index wellness_checkins_user_created_idx
  on public.wellness_checkins (user_id, created_at desc);
create index wellness_assessments_user_created_idx
  on public.wellness_assessments (user_id, created_at desc);
create index appointment_requests_user_created_idx
  on public.appointment_requests (user_id, created_at desc);

alter table public.wellness_checkins enable row level security;
alter table public.wellness_assessments enable row level security;
alter table public.appointment_requests enable row level security;

create policy "Users can read their own wellness check-ins"
  on public.wellness_checkins for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own wellness check-ins"
  on public.wellness_checkins for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wellness check-ins"
  on public.wellness_checkins for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own wellness assessments"
  on public.wellness_assessments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own wellness assessments"
  on public.wellness_assessments for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own wellness assessments"
  on public.wellness_assessments for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own appointment requests"
  on public.appointment_requests for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own appointment requests"
  on public.appointment_requests for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own appointment requests"
  on public.appointment_requests for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.wellness_checkins from anon, authenticated;
revoke all on public.wellness_assessments from anon, authenticated;
revoke all on public.appointment_requests from anon, authenticated;

grant select, insert, delete on public.wellness_checkins to authenticated;
grant select, insert, delete on public.wellness_assessments to authenticated;
grant select, insert, delete on public.appointment_requests to authenticated;
