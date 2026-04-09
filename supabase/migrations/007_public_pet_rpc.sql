create or replace function public.get_public_pet_by_slug(slug text)
returns table (
  id uuid,
  public_slug text,
  name text,
  species pet_species,
  breed text,
  size pet_size,
  status pet_status,
  photos jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.public_slug,
    p.name,
    p.species,
    p.breed,
    p.size,
    p.status,
    p.photos
  from public.pets p
  where p.public_slug = slug
  limit 1;
$$;

grant execute on function public.get_public_pet_by_slug(text) to anon, authenticated;

