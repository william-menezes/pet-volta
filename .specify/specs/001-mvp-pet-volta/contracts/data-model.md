# 🐾 Pet Volta MVP — Data Model (v2)

> **Changelog v2:** reward_amount_cents, lost_description, public_slug, ip geoloc fields, plan_tier 4 valores, pet_co_tutors, max_photos

---

## Enums

```sql
CREATE TYPE pet_species AS ENUM ('dog', 'cat', 'other');
CREATE TYPE pet_size AS ENUM ('small', 'medium', 'large');
CREATE TYPE pet_status AS ENUM ('safe', 'lost');
CREATE TYPE tag_status AS ENUM ('orphan', 'active', 'disabled');
CREATE TYPE health_record_type AS ENUM ('vaccination', 'consultation', 'medication', 'exam');
CREATE TYPE plan_tier AS ENUM ('digital', 'essential', 'elite', 'guardian');
CREATE TYPE subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
```

---

## Tabelas

### profiles

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone_primary TEXT,
  phone_emergency TEXT,
  city TEXT,
  state TEXT CHECK (state IS NULL OR length(state) = 2),
  avatar_url TEXT,
  show_phone BOOLEAN DEFAULT true,
  plan_tier plan_tier DEFAULT 'digital',
  stripe_customer_id TEXT UNIQUE,
  subscription_status subscription_status DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### pets (v2)

```sql
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  public_slug TEXT UNIQUE NOT NULL,                              -- NEW: slug para /p/{slug}
  species pet_species NOT NULL,
  breed TEXT,
  size pet_size,
  birth_date DATE,
  color TEXT,
  microchip_id TEXT,
  temperament TEXT,
  medical_notes TEXT,
  emergency_visible BOOLEAN DEFAULT false,
  status pet_status DEFAULT 'safe',
  lost_since TIMESTAMPTZ,
  reward_amount_cents INTEGER DEFAULT 0,                         -- NEW: recompensa em centavos
  lost_description TEXT CHECK (lost_description IS NULL OR length(lost_description) <= 500), -- NEW
  max_photos INTEGER DEFAULT 1,                                  -- NEW: derivado do plano
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pets_owner ON public.pets(owner_id);
CREATE INDEX idx_pets_status ON public.pets(status);
CREATE INDEX idx_pets_slug ON public.pets(public_slug);
```

### tags

```sql
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_code TEXT UNIQUE NOT NULL CHECK (length(tag_code) BETWEEN 6 AND 20),
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  activated_by UUID REFERENCES public.profiles(id),
  activated_at TIMESTAMPTZ,
  status tag_status DEFAULT 'orphan',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tags_code ON public.tags(tag_code);
CREATE INDEX idx_tags_pet ON public.tags(pet_id);
```

### health_records

```sql
CREATE TABLE public.health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  type health_record_type NOT NULL,
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  date DATE NOT NULL,
  next_date DATE,
  veterinarian TEXT,
  notes TEXT,
  attachment_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_health_pet ON public.health_records(pet_id);
CREATE INDEX idx_health_date ON public.health_records(date DESC);
```

### scan_events (v2 — com IP geolocation)

```sql
CREATE TABLE public.scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES public.tags(id),
  pet_id UUID NOT NULL REFERENCES public.pets(id),
  scanned_at TIMESTAMPTZ DEFAULT now(),
  -- Localização precisa (browser geolocation)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Localização aproximada (IP geolocation) — NEW
  ip_city TEXT,
  ip_region TEXT,
  ip_country TEXT,
  ip_lat DOUBLE PRECISION,
  ip_lon DOUBLE PRECISION,
  -- Tipo de localização obtida
  location_type TEXT DEFAULT 'none' CHECK (location_type IN ('precise', 'approximate', 'none')),
  -- Metadados
  ip_hash TEXT,
  user_agent TEXT,
  message TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scan_pet ON public.scan_events(pet_id);
CREATE INDEX idx_scan_time ON public.scan_events(scanned_at DESC);
CREATE INDEX idx_scan_debounce ON public.scan_events(tag_id, ip_hash, scanned_at DESC);
```

### pet_co_tutors (NEW — multi-tutor Elite+)

```sql
CREATE TABLE public.pet_co_tutors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pet_id, profile_id)
);

CREATE INDEX idx_co_tutors_pet ON public.pet_co_tutors(pet_id);
CREATE INDEX idx_co_tutors_profile ON public.pet_co_tutors(profile_id);
```

### notification_prefs

```sql
CREATE TABLE public.notification_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  snooze_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### stripe_events (idempotency)

```sql
CREATE TABLE public.stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

---

## RLS Policies v2

### pets — INSERT com limite de plano (4 tiers)

```sql
CREATE POLICY insert_pet_within_limit ON public.pets
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (SELECT count(*) FROM public.pets WHERE owner_id = auth.uid()) <
    CASE (SELECT plan_tier FROM public.profiles WHERE id = auth.uid())
      WHEN 'digital' THEN 1
      WHEN 'essential' THEN 1
      WHEN 'elite' THEN 3
      WHEN 'guardian' THEN 5
      ELSE 0
    END
  );
```

### health_records — INSERT com limite mensal (plano digital)

```sql
CREATE POLICY insert_health_record ON public.health_records
  FOR INSERT TO authenticated
  WITH CHECK (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()) AND
    (
      (SELECT plan_tier FROM public.profiles WHERE id = auth.uid()) != 'digital'
      OR
      (SELECT count(*) FROM public.health_records
       WHERE pet_id = NEW.pet_id
       AND created_at >= date_trunc('month', now())) < 2
    )
  );
```

### pet_co_tutors — INSERT apenas Elite+

```sql
CREATE POLICY insert_co_tutor ON public.pet_co_tutors
  FOR INSERT TO authenticated
  WITH CHECK (
    invited_by = auth.uid() AND
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()) AND
    (SELECT plan_tier FROM public.profiles WHERE id = auth.uid()) IN ('elite', 'guardian')
  );

-- Co-tutor pode ler pets compartilhados
CREATE POLICY select_shared_pets ON public.pets
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT pet_id FROM public.pet_co_tutors WHERE profile_id = auth.uid() AND status = 'accepted')
  );

-- Co-tutor recebe scans dos pets compartilhados
CREATE POLICY select_shared_scans ON public.scan_events
  FOR SELECT TO authenticated
  USING (
    pet_id IN (SELECT id FROM public.pets WHERE owner_id = auth.uid()) OR
    pet_id IN (SELECT pet_id FROM public.pet_co_tutors WHERE profile_id = auth.uid() AND status = 'accepted')
  );
```

---

## Storage Buckets

```sql
-- Fotos de pets (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', true);

-- Avatares (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Anexos de saúde (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('health-attachments', 'health-attachments', false);
```

Policies de storage seguem padrão v1: upload pelo owner (pasta `{userId}/`), leitura pública para fotos/avatares, leitura restrita para health-attachments.

**Otimização para Supabase Free (1GB storage):**
- Fotos comprimidas client-side: max 500KB/foto (canvas resize + quality 80%)
- Formato WebP preferencial
- Limite de fotos por plano impede acumulação excessiva
- Monitorar uso via dashboard Supabase
