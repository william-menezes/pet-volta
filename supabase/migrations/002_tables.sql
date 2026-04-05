create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone_primary text,
  phone_emergency text,
  city text,
  state text check (state is null or length(state) = 2),
  avatar_url text,
  show_phone boolean default true,
  plan_tier plan_tier default 'digital',
  stripe_customer_id text unique,
  subscription_status subscription_status default 'active',
  trial_ends_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  public_slug text unique not null,
  species pet_species not null,
  breed text,
  size pet_size,
  birth_date date,
  color text,
  microchip_id text,
  temperament text,
  medical_notes text,
  emergency_visible boolean default false,
  status pet_status default 'safe',
  lost_since timestamptz,
  reward_amount_cents integer default 0,
  lost_description text check (lost_description is null or length(lost_description) <= 500),
  max_photos integer default 1,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pets_owner on public.pets(owner_id);
create index if not exists idx_pets_status on public.pets(status);
create index if not exists idx_pets_slug on public.pets(public_slug);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  tag_code text unique not null check (length(tag_code) between 6 and 20),
  pet_id uuid references public.pets(id) on delete set null,
  activated_by uuid references public.profiles(id),
  activated_at timestamptz,
  status tag_status default 'orphan',
  created_at timestamptz default now()
);

create index if not exists idx_tags_code on public.tags(tag_code);
create index if not exists idx_tags_pet on public.tags(pet_id);

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  type health_record_type not null,
  title text not null check (length(title) between 1 and 200),
  date date not null,
  next_date date,
  veterinarian text,
  notes text,
  attachment_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_health_pet on public.health_records(pet_id);
create index if not exists idx_health_date on public.health_records(date desc);

create table if not exists public.scan_events (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references public.tags(id),
  pet_id uuid not null references public.pets(id),
  scanned_at timestamptz default now(),
  latitude double precision,
  longitude double precision,
  ip_city text,
  ip_region text,
  ip_country text,
  ip_lat double precision,
  ip_lon double precision,
  location_type text default 'none' check (location_type in ('precise', 'approximate', 'none')),
  ip_hash text,
  user_agent text,
  message text,
  notified boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_scan_pet on public.scan_events(pet_id);
create index if not exists idx_scan_time on public.scan_events(scanned_at desc);
create index if not exists idx_scan_debounce on public.scan_events(tag_id, ip_hash, scanned_at desc);

create table if not exists public.pet_co_tutors (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  invited_by uuid not null references public.profiles(id),
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique (pet_id, profile_id)
);

create index if not exists idx_co_tutors_pet on public.pet_co_tutors(pet_id);
create index if not exists idx_co_tutors_profile on public.pet_co_tutors(profile_id);

create table if not exists public.notification_prefs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  email_enabled boolean default true,
  push_enabled boolean default false,
  push_subscription jsonb,
  snooze_until timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz default now()
);

