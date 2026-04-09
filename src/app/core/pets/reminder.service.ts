import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { Reminder, ReminderCreateInput } from '@models/reminder.model';

const SELECT = 'id,pet_id,owner_id,title,type,due_date,repeat_interval,notes,done,done_at,created_at';

@Injectable({ providedIn: 'root' })
export class ReminderService {
  private readonly supabase = inject(SupabaseClientService);

  readonly reminders = signal<Reminder[]>([]);
  readonly loading = signal(false);

  async listByPet(petId: string): Promise<Reminder[]> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .supabase()
        .from('reminders')
        .select(SELECT)
        .eq('pet_id', petId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      const result = (data ?? []) as Reminder[];
      this.reminders.set(result);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async listAllForOwner(): Promise<Reminder[]> {
    this.loading.set(true);
    try {
      const { data, error } = await this.supabase
        .supabase()
        .from('reminders')
        .select(SELECT)
        .eq('done', false)
        .order('due_date', { ascending: true });

      if (error) throw error;
      const result = (data ?? []) as Reminder[];
      this.reminders.set(result);
      return result;
    } finally {
      this.loading.set(false);
    }
  }

  async listDueToday(): Promise<Reminder[]> {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const end   = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString();

    const { data, error } = await this.supabase
      .supabase()
      .from('reminders')
      .select(SELECT)
      .eq('done', false)
      .gte('due_date', start)
      .lt('due_date', end)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Reminder[];
  }

  async create(input: ReminderCreateInput): Promise<Reminder> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) throw new Error('Usuário não autenticado');

    const { data, error } = await this.supabase
      .supabase()
      .from('reminders')
      .insert({ ...input, owner_id: userId })
      .select(SELECT)
      .single();

    if (error) throw error;
    const created = data as Reminder;
    this.reminders.update((prev) => [...prev, created].sort(
      (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    ));
    return created;
  }

  async markDone(id: string, done: boolean): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('reminders')
      .update({ done, done_at: done ? new Date().toISOString() : null })
      .eq('id', id);

    if (error) throw error;
    this.reminders.update((prev) =>
      prev.map((r) => r.id === id ? { ...r, done, done_at: done ? new Date().toISOString() : null } : r),
    );
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .supabase()
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;
    this.reminders.update((prev) => prev.filter((r) => r.id !== id));
  }
}
