import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { PlanService } from '@core/plan/plan.service';
import { Pet, PetCreateInput, PetPhoto, PetUpdateInput } from '@models/pet.model';
import { compressImageFile } from '@core/storage/image-compress';

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export function generatePublicSlug(name: string) {
  const base = slugify(name);
  const safeBase = base.length ? base.slice(0, 40) : 'pet';
  return `${safeBase}-${randomSuffix()}`;
}

@Injectable({ providedIn: 'root' })
export class PetService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly plan = inject(PlanService);

  async listMyPets(): Promise<Pick<Pet, 'id' | 'name' | 'public_slug' | 'species' | 'status' | 'photos' | 'reward_amount_cents'>[]> {
    const { data, error } = await this.supabase
      .supabase()
      .from('pets')
      .select('id,name,public_slug,species,status,photos,reward_amount_cents')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as any;
  }

  async getMyPetById(id: string): Promise<Pet | null> {
    const { data, error } = await this.supabase
      .supabase()
      .from('pets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data ?? null) as any;
  }

  async createPet(input: PetCreateInput): Promise<Pet> {
    const maxPhotos = this.plan.getPhotoLimit();
    const photoFiles = (input.photos ?? []).slice(0, maxPhotos);

    let publicSlug = generatePublicSlug(input.name);
    let petRow: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await this.supabase
        .supabase()
        .from('pets')
        .insert({
          name: input.name,
          public_slug: publicSlug,
          species: input.species,
          breed: input.breed ?? null,
          size: input.size ?? null,
          birth_date: input.birth_date ?? null,
          color: input.color ?? null,
          microchip_id: input.microchip_id ?? null,
          temperament: input.temperament ?? null,
          medical_notes: input.medical_notes ?? null,
          emergency_visible: Boolean(input.emergency_visible),
          max_photos: maxPhotos,
        })
        .select('*')
        .single();

      if (!error) {
        petRow = data;
        break;
      }

      const message = String(error.message ?? '');
      if (message.includes('public_slug') && message.toLowerCase().includes('duplicate')) {
        publicSlug = generatePublicSlug(input.name);
        continue;
      }
      throw error;
    }

    if (!petRow) {
      throw new Error('Não foi possível criar o pet.');
    }

    if (photoFiles.length) {
      const photos = await this.uploadPetPhotos(petRow.id, photoFiles, maxPhotos);
      const { data, error } = await this.supabase
        .supabase()
        .from('pets')
        .update({ photos })
        .eq('id', petRow.id)
        .select('*')
        .single();
      if (error) throw error;
      return data as any;
    }

    return petRow as any;
  }

  async updatePet(petId: string, input: PetUpdateInput): Promise<Pet> {
    const maxPhotos = this.plan.getPhotoLimit();

    const { photos, ...fields } = input;
    const patch: Record<string, unknown> = { ...fields };
    patch['max_photos'] = maxPhotos;

    const { data: updated, error } = await this.supabase
      .supabase()
      .from('pets')
      .update(patch)
      .eq('id', petId)
      .select('*')
      .single();
    if (error) throw error;

    if (photos?.length) {
      const uploaded = await this.uploadPetPhotos(petId, photos, maxPhotos);
      const merged = [...(updated.photos ?? []), ...uploaded].slice(0, maxPhotos);
      const { data: updatedWithPhotos, error: photoError } = await this.supabase
        .supabase()
        .from('pets')
        .update({ photos: merged })
        .eq('id', petId)
        .select('*')
        .single();
      if (photoError) throw photoError;
      return updatedWithPhotos as any;
    }

    return updated as any;
  }

  async deletePet(petId: string) {
    const { error } = await this.supabase.supabase().from('pets').delete().eq('id', petId);
    if (error) throw error;
  }

  async uploadPetPhotos(petId: string, files: File[], maxPhotos: number): Promise<PetPhoto[]> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) {
      throw new Error('Você precisa estar logado para enviar fotos.');
    }

    const selected = files.slice(0, maxPhotos);
    const results: PetPhoto[] = [];

    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]!;
      const compressed = await compressImageFile(file, { mimeType: 'image/webp', quality: 0.8 });
      const path = `${userId}/${petId}/${crypto.randomUUID()}.webp`;
      const { error } = await this.supabase
        .supabase()
        .storage.from('pet-photos')
        .upload(path, compressed, {
          upsert: false,
          contentType: 'image/webp',
          cacheControl: '31536000',
        });
      if (error) throw error;

      const { data } = this.supabase.supabase().storage.from('pet-photos').getPublicUrl(path);
      results.push({ path, url: data.publicUrl });
    }

    return results;
  }
}

