create or replace function public.is_wellness_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users
    where id = (select auth.uid())
      and lower(email) = 'kathia.aguilar@ulv.edu.mx'
      and email_confirmed_at is not null
  );
$$;

revoke all on function public.is_wellness_staff() from public, anon;
grant execute on function public.is_wellness_staff() to authenticated;

alter table public.appointment_requests
  add column completed_at timestamptz;

create policy "Wellness staff can read appointment requests"
  on public.appointment_requests for select to authenticated
  using ((select public.is_wellness_staff()));

create policy "Wellness staff can mark appointments completed"
  on public.appointment_requests for update to authenticated
  using ((select public.is_wellness_staff()))
  with check ((select public.is_wellness_staff()));

revoke update on public.appointment_requests from anon, authenticated;
grant update (completed_at) on public.appointment_requests to authenticated;

create table public.appointment_satisfaction (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique
    references public.appointment_requests (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create index appointment_satisfaction_user_created_idx
  on public.appointment_satisfaction (user_id, created_at desc);

alter table public.appointment_satisfaction enable row level security;

create policy "Users can read their own appointment satisfaction"
  on public.appointment_satisfaction for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can rate their completed appointments"
  on public.appointment_satisfaction for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.appointment_requests
      where appointment_requests.id = appointment_satisfaction.appointment_id
        and appointment_requests.user_id = (select auth.uid())
        and appointment_requests.completed_at is not null
    )
  );

revoke all on public.appointment_satisfaction from anon, authenticated;
grant select, insert on public.appointment_satisfaction to authenticated;

create or replace function public.get_public_wellness_stats()
returns table (
  students_attended bigint,
  satisfaction_percent integer,
  satisfaction_responses bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (
      select count(distinct user_id)
      from public.appointment_requests
      where completed_at is not null
    ) as students_attended,
    (
      select case
        when count(*) >= 5 then round(avg(rating) * 20)::integer
        else null
      end
      from public.appointment_satisfaction
    ) as satisfaction_percent,
    (
      select count(*)
      from public.appointment_satisfaction
    ) as satisfaction_responses;
$$;

revoke all on function public.get_public_wellness_stats() from public;
grant execute on function public.get_public_wellness_stats() to anon, authenticated;

notify pgrst, 'reload schema';
