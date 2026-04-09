import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { NutritionLog, NutritionLogCreateInput } from '@models/nutrition.model';

const SELECT = 'id,pet_id,owner_id,food_name,portion_grams,calories,meal_time,notes,created_at';

@Injectable({ providedIn: 'root' })
export class NutritionService {
  private readonly supabase = inject(SupabaseClientService);

  readonly logs = signal<NutritionLog[]>([]);
  readonly loading = signal(false);

  async listByPet(petId: string, date?: Date): Promise<NutritionLog[]> {
    this.loading.set(true);
    try {
      let query = this.supabase
        .supabase()
        .from('nutrition_logs')
        .select(SELECT)
        .eq('pet_id', petId)
        .order('meal_time', { ascending: false });

      if (date) {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const end   = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
        query = query.gte('meal_time', start).lt('meal_time', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      const result = (data ?? []) as NutritionLog[];
      this.logs.set(result);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  dailyCalories(logsForDay: NutritionLog[]): number {
    return logsForDay.reduce((sum, l) => sum + (l.calories ?? 0), 0);
  }

  async create(input: NutritionLogCreateInput): Promise<NutritionLog> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .supabase()
      .from('nutrition_logs')
      .insert({ ...input, owner_id: userId })
      .select(SELECT)
      .single();

    if (error) throw error;
    const created = data as NutritionLog;
    this.logs.update((prev) => [created, ...prev]);
    return created;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('nutrition_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    this.logs.update((prev) => prev.filter((l) => l.id !== id));
  }
}
