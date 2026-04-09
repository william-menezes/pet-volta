-- Tabela de registro de alimentação do pet
create table if not exists nutrition_logs (
  id            uuid primary key default gen_random_uuid(),
  pet_id        uuid not null references pets(id) on delete cascade,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  food_name     text not null,
  portion_grams integer check (portion_grams > 0),
  calories      integer check (calories >= 0),
  meal_time     timestamptz not null default now(),
  notes         text,
  created_at    timestamptz not null default now()
);

-- Índices de performance
create index idx_nutrition_owner    on nutrition_logs(owner_id);
create index idx_nutrition_pet      on nutrition_logs(pet_id);
create index idx_nutrition_mealtime on nutrition_logs(pet_id, meal_time desc);

-- RLS
alter table nutrition_logs enable row level security;

create policy "Tutor lê seus logs de nutrição"
  on nutrition_logs for select
  using (owner_id = auth.uid());

create policy "Tutor cria logs de nutrição"
  on nutrition_logs for insert
  with check (owner_id = auth.uid());

create policy "Tutor deleta seus logs de nutrição"
  on nutrition_logs for delete
  using (owner_id = auth.uid());
