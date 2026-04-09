import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';

export type NotificationPrefs = {
  id: string;
  user_id: string;
  email_enabled: boolean;
  snooze_until: string | null;
  created_at: string;
  updated_at: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationPrefsService {
  private readonly supabase = inject(SupabaseClientService);

  readonly prefs = signal<NotificationPrefs | null>(null);
  readonly loading = signal(false);

  async loadPrefs(): Promise<void> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    this.loading.set(true);
    try {
      const { data } = await this.supabase
        .supabase()
        .from('notification_prefs')
        .select('id,user_id,email_enabled,snooze_until,created_at,updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      this.prefs.set(data as NotificationPrefs | null);
    } finally {
      this.loading.set(false);
    }
  }

  async toggleEmailEnabled(enabled: boolean): Promise<void> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    const { data, error } = await this.supabase
      .supabase()
      .from('notification_prefs')
      .upsert({ user_id: userId, email_enabled: enabled }, { onConflict: 'user_id' })
      .select()
      .single();

    if (!error && data) {
      this.prefs.set(data as NotificationPrefs);
    }
  }

  async setSnoozeUntil(hours: 1 | 8 | 24 | null): Promise<void> {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    const snoozeUntil = hours
      ? new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await this.supabase
      .supabase()
      .from('notification_prefs')
      .upsert({ user_id: userId, snooze_until: snoozeUntil }, { onConflict: 'user_id' })
      .select()
      .single();

    if (!error && data) {
      this.prefs.set(data as NotificationPrefs);
    }
  }
}
