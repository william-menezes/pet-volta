create extension if not exists pgcrypto;

do $$ begin
  create type pet_species as enum ('dog', 'cat', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type pet_size as enum ('small', 'medium', 'large');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type pet_status as enum ('safe', 'lost');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type tag_status as enum ('orphan', 'active', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type health_record_type as enum ('vaccination', 'consultation', 'medication', 'exam');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type plan_tier as enum ('digital', 'essential', 'elite', 'guardian');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_status as enum ('active', 'trialing', 'past_due', 'canceled', 'incomplete');
exception
  when duplicate_object then null;
end $$;

