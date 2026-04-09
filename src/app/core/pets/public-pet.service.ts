import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';

export type PublicPet = {
  id: string;
  public_slug: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string | null;
  size: 'small' | 'medium' | 'large' | null;
  birth_date: string | null;
  status: 'safe' | 'lost';
  lost_since: string | null;
  lost_description: string | null;
  reward_amount_cents: number;
  photos: Array<{ url: string; path: string }>;
  tutor_name: string | null;
  tutor_phone: string | null;
  tutor_city: string | null;
  tutor_state: string | null;
  tutor_show_phone: boolean;
  tag_code: string | null;
};

const PUBLIC_PET_SELECT = `
  id,
  public_slug,
  name,
  species,
  breed,
  size,
  birth_date,
  status,
  lost_since,
  lost_description,
  reward_amount_cents,
  photos,
  profiles!owner_id (
    full_name,
    phone_primary,
    city,
    state,
    show_phone
  ),
  tags!pet_id (
    tag_code
  )
`.trim();

@Injectable({ providedIn: 'root' })
export class PublicPetService {
  private readonly supabase = inject(SupabaseClientService);

  async fetchPetByTagCode(tagCode: string): Promise<PublicPet | null> {
    const { data, error } = await this.supabase
      .supabase()
      .from('tags')
      .select(`
        tag_code,
        pets!pet_id (
          id, public_slug, name, species, breed, size, birth_date,
          status, lost_since, lost_description, reward_amount_cents, photos,
          profiles!owner_id ( full_name, phone_primary, city, state, show_phone )
        )
      `)
      .eq('tag_code', tagCode)
      .maybeSingle();

    if (error || !data?.pets) return null;

    const petRaw = Array.isArray(data.pets) ? data.pets[0] : data.pets;
    if (!petRaw) return null;

    return this.mapPet(petRaw as Record<string, unknown>, tagCode);
  }

  async fetchPetBySlug(slug: string): Promise<PublicPet | null> {
    const { data, error } = await this.supabase
      .supabase()
      .from('pets')
      .select(`
        id, public_slug, name, species, breed, size, birth_date,
        status, lost_since, lost_description, reward_amount_cents, photos,
        profiles!owner_id ( full_name, phone_primary, city, state, show_phone ),
        tags!pet_id ( tag_code )
      `)
      .eq('public_slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    const tagCode = (data as Record<string, unknown>)['tags'] as Array<{ tag_code: string }> | null;
    return this.mapPet(data as Record<string, unknown>, tagCode?.[0]?.tag_code ?? null);
  }

  private mapPet(raw: Record<string, unknown>, tagCode: string | null): PublicPet {
    const profile = raw['profiles'] as Record<string, unknown> | null;
    return {
      id: raw['id'] as string,
      public_slug: raw['public_slug'] as string,
      name: raw['name'] as string,
      species: raw['species'] as PublicPet['species'],
      breed: raw['breed'] as string | null,
      size: raw['size'] as PublicPet['size'],
      birth_date: raw['birth_date'] as string | null,
      status: raw['status'] as 'safe' | 'lost',
      lost_since: raw['lost_since'] as string | null,
      lost_description: raw['lost_description'] as string | null,
      reward_amount_cents: (raw['reward_amount_cents'] as number) ?? 0,
      photos: (raw['photos'] as Array<{ url: string; path: string }>) ?? [],
      tutor_name: (profile?.['full_name'] as string | null) ?? null,
      tutor_phone: (profile?.['phone_primary'] as string | null) ?? null,
      tutor_city: (profile?.['city'] as string | null) ?? null,
      tutor_state: (profile?.['state'] as string | null) ?? null,
      tutor_show_phone: (profile?.['show_phone'] as boolean) ?? false,
      tag_code: tagCode,
    };
  }
}
