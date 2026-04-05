alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.tags enable row level security;
alter table public.health_records enable row level security;
alter table public.scan_events enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.pet_co_tutors enable row level security;
alter table public.stripe_events enable row level security;

-- profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- pets
drop policy if exists pets_select_owned_or_shared on public.pets;
create policy pets_select_owned_or_shared on public.pets
  for select to authenticated
  using (
    owner_id = auth.uid()
    or id in (
      select pet_id
      from public.pet_co_tutors
      where profile_id = auth.uid() and status = 'accepted'
    )
  );

drop policy if exists pets_insert_within_plan_limit on public.pets;
create policy pets_insert_within_plan_limit on public.pets
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and (select count(*) from public.pets where owner_id = auth.uid()) <
      case (select plan_tier from public.profiles where id = auth.uid())
        when 'digital' then 1
        when 'essential' then 1
        when 'elite' then 3
        when 'guardian' then 5
        else 0
      end
  );

drop policy if exists pets_update_owned on public.pets;
create policy pets_update_owned on public.pets
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists pets_delete_owned on public.pets;
create policy pets_delete_owned on public.pets
  for delete to authenticated
  using (owner_id = auth.uid());

-- tags (public read for scanning)
drop policy if exists tags_select_public_active on public.tags;
create policy tags_select_public_active on public.tags
  for select to anon
  using (status = 'active');

drop policy if exists tags_select_owned on public.tags;
create policy tags_select_owned on public.tags
  for select to authenticated
  using (
    pet_id in (select id from public.pets where owner_id = auth.uid())
    or activated_by = auth.uid()
  );

drop policy if exists tags_update_activate_or_manage on public.tags;
create policy tags_update_activate_or_manage on public.tags
  for update to authenticated
  using (
    status = 'orphan'
    or activated_by = auth.uid()
    or pet_id in (select id from public.pets where owner_id = auth.uid())
  )
  with check (
    activated_by = auth.uid()
    or pet_id in (select id from public.pets where owner_id = auth.uid())
  );

-- health_records
drop policy if exists health_records_select_owned on public.health_records;
create policy health_records_select_owned on public.health_records
  for select to authenticated
  using (
    pet_id in (select id from public.pets where owner_id = auth.uid())
  );

drop policy if exists health_records_insert_limit_digital_monthly on public.health_records;
create policy health_records_insert_limit_digital_monthly on public.health_records
  for insert to authenticated
  with check (
    pet_id in (select id from public.pets where owner_id = auth.uid())
    and (
      (select plan_tier from public.profiles where id = auth.uid()) != 'digital'
      or (
        select count(*)
        from public.health_records
        where pet_id = health_records.pet_id
          and created_at >= date_trunc('month', now())
      ) < 2
    )
  );

drop policy if exists health_records_update_owned on public.health_records;
create policy health_records_update_owned on public.health_records
  for update to authenticated
  using (pet_id in (select id from public.pets where owner_id = auth.uid()))
  with check (pet_id in (select id from public.pets where owner_id = auth.uid()));

drop policy if exists health_records_delete_owned on public.health_records;
create policy health_records_delete_owned on public.health_records
  for delete to authenticated
  using (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- scan_events
drop policy if exists scan_events_select_owned_or_shared on public.scan_events;
create policy scan_events_select_owned_or_shared on public.scan_events
  for select to authenticated
  using (
    pet_id in (select id from public.pets where owner_id = auth.uid())
    or pet_id in (
      select pet_id
      from public.pet_co_tutors
      where profile_id = auth.uid() and status = 'accepted'
    )
  );

drop policy if exists scan_events_service_all on public.scan_events;
create policy scan_events_service_all on public.scan_events
  for all to service_role
  using (true)
  with check (true);

-- notification_prefs
drop policy if exists notification_prefs_select_own on public.notification_prefs;
create policy notification_prefs_select_own on public.notification_prefs
  for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists notification_prefs_update_own on public.notification_prefs;
create policy notification_prefs_update_own on public.notification_prefs
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- pet_co_tutors
drop policy if exists pet_co_tutors_insert_elite_plus on public.pet_co_tutors;
create policy pet_co_tutors_insert_elite_plus on public.pet_co_tutors
  for insert to authenticated
  with check (
    invited_by = auth.uid()
    and pet_id in (select id from public.pets where owner_id = auth.uid())
    and (select plan_tier from public.profiles where id = auth.uid()) in ('elite', 'guardian')
  );

drop policy if exists pet_co_tutors_select_involved on public.pet_co_tutors;
create policy pet_co_tutors_select_involved on public.pet_co_tutors
  for select to authenticated
  using (
    invited_by = auth.uid()
    or profile_id = auth.uid()
    or pet_id in (select id from public.pets where owner_id = auth.uid())
  );

drop policy if exists pet_co_tutors_update_accept_reject on public.pet_co_tutors;
create policy pet_co_tutors_update_accept_reject on public.pet_co_tutors
  for update to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

drop policy if exists pet_co_tutors_delete_owner on public.pet_co_tutors;
create policy pet_co_tutors_delete_owner on public.pet_co_tutors
  for delete to authenticated
  using (pet_id in (select id from public.pets where owner_id = auth.uid()));

-- stripe_events (service only)
drop policy if exists stripe_events_service_all on public.stripe_events;
create policy stripe_events_service_all on public.stripe_events
  for all to service_role
  using (true)
  with check (true);

