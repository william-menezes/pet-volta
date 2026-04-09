-- Tabela de consultas veterinárias
create table if not exists vet_visits (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references pets(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  vet_name     text not null,
  clinic_name  text,
  phone        text,
  visit_date   date not null,
  reason       text not null,
  diagnosis    text,
  prescription text,
  next_visit   date,
  notes        text,
  created_at   timestamptz not null default now()
);

-- Índices de performance
create index idx_vet_visits_owner on vet_visits(owner_id);
create index idx_vet_visits_pet   on vet_visits(pet_id);
create index idx_vet_visits_date  on vet_visits(pet_id, visit_date desc);

-- RLS
alter table vet_visits enable row level security;

create policy "Tutor lê suas consultas"
  on vet_visits for select
  using (owner_id = auth.uid());

create policy "Tutor cria consultas"
  on vet_visits for insert
  with check (owner_id = auth.uid());

create policy "Tutor atualiza suas consultas"
  on vet_visits for update
  using (owner_id = auth.uid());

create policy "Tutor deleta suas consultas"
  on vet_visits for delete
  using (owner_id = auth.uid());
