import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { PlanService } from '@core/plan/plan.service';
import {
  HealthRecord,
  HealthRecordCreateInput,
  HealthRecordType,
} from '@models/health-record.model';

@Injectable({ providedIn: 'root' })
export class HealthRecordService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly plan = inject(PlanService);

  readonly loading = signal(false);

  async listByPet(petId: string): Promise<HealthRecord[]> {
    const { data, error } = await this.supabase
      .supabase()
      .from('health_records')
      .select('id,pet_id,type,title,date,next_date,veterinarian,notes,attachment_url,metadata,created_at')
      .eq('pet_id', petId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as HealthRecord[];
  }

  /** Contagem de registros no mês corrente para enforcement do limite Digital */
  async monthlyCountForPet(petId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await this.supabase
      .supabase()
      .from('health_records')
      .select('id', { count: 'exact', head: true })
      .eq('pet_id', petId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;
    return count ?? 0;
  }

  async create(input: HealthRecordCreateInput): Promise<HealthRecord> {
    const { data, error } = await this.supabase
      .supabase()
      .from('health_records')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as HealthRecord;
  }

  async update(id: string, patch: Partial<HealthRecordCreateInput>): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('health_records')
      .update(patch)
      .eq('id', id);

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('health_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /** Verifica se o tutor pode criar mais registros (Digital: 2/mês) */
  async canCreateForPet(petId: string): Promise<{ allowed: boolean; monthlyCount: number }> {
    const limit = this.plan.limits().healthRecordsMonthly;
    if (limit === null) return { allowed: true, monthlyCount: 0 }; // planos pagos: ilimitado

    const monthlyCount = await this.monthlyCountForPet(petId);
    return { allowed: monthlyCount < limit, monthlyCount };
  }

  typeOptions(): { value: HealthRecordType; label: string }[] {
    return [
      { value: 'vaccination',  label: '💉 Vacinação' },
      { value: 'consultation', label: '🩺 Consulta' },
      { value: 'medication',   label: '💊 Medicação' },
      { value: 'exam',         label: '🔬 Exame' },
    ];
  }
}
