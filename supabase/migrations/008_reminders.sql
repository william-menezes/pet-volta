-- Tabela de lembretes de saúde do pet (vacinas, medicações, consultas)
create table if not exists reminders (
  id           uuid primary key default gen_random_uuid(),
  pet_id       uuid not null references pets(id) on delete cascade,
  owner_id     uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  type         text not null check (type in ('vaccination', 'medication', 'consultation', 'other')),
  due_date     timestamptz not null,
  repeat_interval text check (repeat_interval in ('daily', 'weekly', 'monthly', 'yearly')),
  notes        text,
  done         boolean not null default false,
  done_at      timestamptz,
  created_at   timestamptz not null default now()
);

-- Índices de performance
create index idx_reminders_owner   on reminders(owner_id);
create index idx_reminders_pet     on reminders(pet_id);
create index idx_reminders_due     on reminders(due_date) where done = false;

-- RLS
alter table reminders enable row level security;

create policy "Tutor lê seus próprios lembretes"
  on reminders for select
  using (owner_id = auth.uid());

create policy "Tutor cria lembretes"
  on reminders for insert
  with check (owner_id = auth.uid());

create policy "Tutor atualiza seus lembretes"
  on reminders for update
  using (owner_id = auth.uid());

create policy "Tutor deleta seus lembretes"
  on reminders for delete
  using (owner_id = auth.uid());
