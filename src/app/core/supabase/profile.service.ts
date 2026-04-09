import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { compressImageFile } from '@core/storage/image-compress';
import { Profile, ProfileUpdateInput } from '@models/profile.model';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly supabase = inject(SupabaseClientService);

  readonly profile = signal<Profile | null>(null);
  readonly loading = signal(false);

  async fetchProfile(): Promise<Profile | null> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return null;

    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .supabase()
        .from('profiles')
        .select('id,full_name,phone_primary,phone_emergency,city,state,avatar_url,show_phone,plan_tier,stripe_customer_id,subscription_status,created_at,updated_at')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      this.profile.set(data as Profile);
      return data as Profile;
    } finally {
      this.loading.set(false);
    }
  }

  async updateProfile(patch: ProfileUpdateInput): Promise<void> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .supabase()
      .from('profiles')
      .update(patch)
      .eq('id', userId)
      .select('id,full_name,phone_primary,phone_emergency,city,state,avatar_url,show_phone,plan_tier,stripe_customer_id,subscription_status,created_at,updated_at')
      .single();

    if (error) throw error;
    this.profile.set(data as Profile);
  }

  async uploadAvatar(file: File): Promise<string> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    if (file.size > MAX_AVATAR_BYTES) {
      const compressed = await compressImageFile(file, { maxWidth: 400, maxHeight: 400, quality: 0.8, mimeType: 'image/webp' });
      if (compressed.size > MAX_AVATAR_BYTES) {
        throw new Error('Imagem muito grande. Máximo 2MB.');
      }
      file = new File([compressed], 'avatar.webp', { type: 'image/webp' });
    }

    const path = `${userId}/avatar.webp`;
    const { error } = await this.supabase
      .supabase()
      .storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (error) throw error;

    const { data } = this.supabase
      .supabase()
      .storage
      .from('avatars')
      .getPublicUrl(path);

    return data.publicUrl;
  }
}
