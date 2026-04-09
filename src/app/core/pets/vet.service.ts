import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { VetVisit, VetVisitCreateInput, VetVisitUpdateInput } from '@models/vet.model';

const SELECT = 'id,pet_id,owner_id,vet_name,clinic_name,phone,visit_date,reason,diagnosis,prescription,next_visit,notes,created_at';

@Injectable({ providedIn: 'root' })
export class VetService {
  private readonly supabase = inject(SupabaseClientService);

  readonly visits = signal<VetVisit[]>([]);
  readonly loading = signal(false);

  async listByPet(petId: string): Promise<VetVisit[]> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .supabase()
        .from('vet_visits')
        .select(SELECT)
        .eq('pet_id', petId)
        .order('visit_date', { ascending: false });

      if (error) throw error;
      const result = (data ?? []) as VetVisit[];
      this.visits.set(result);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async lastVisit(petId: string): Promise<VetVisit | null> {
    const { data, error } = await this.supabase
      .supabase()
      .from('vet_visits')
      .select(SELECT)
      .eq('pet_id', petId)
      .order('visit_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as VetVisit | null;
  }

  async create(input: VetVisitCreateInput): Promise<VetVisit> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .supabase()
      .from('vet_visits')
      .insert({ ...input, owner_id: userId })
      .select(SELECT)
      .single();

    if (error) throw error;
    const created = data as VetVisit;
    this.visits.update((prev) => [created, ...prev]);
    return created;
  }

  async update(id: string, patch: VetVisitUpdateInput): Promise<void> {
    const { data, error } = await this.supabase
      .supabase()
      .from('vet_visits')
      .update(patch)
      .eq('id', id)
      .select(SELECT)
      .single();

    if (error) throw error;
    const updated = data as VetVisit;
    this.visits.update((prev) => prev.map((v) => v.id === id ? updated : v));
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('vet_visits')
      .delete()
      .eq('id', id);

    if (error) throw error;
    this.visits.update((prev) => prev.filter((v) => v.id !== id));
  }
}
