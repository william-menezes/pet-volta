import { inject, Injectable, signal } from '@angular/core';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { PlanService } from '@core/plan/plan.service';

export type LocationType = 'precise' | 'approximate' | 'none';

export type ScanEvent = {
  id: string;
  pet_id: string;
  tag_code: string | null;
  scanned_at: string;
  location_type: LocationType;
  ip_city: string | null;
  ip_region: string | null;
  ip_country: string | null;
  ip_lat: number | null;
  ip_lon: number | null;
  message: string | null;
  notified: boolean;
};

const PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class ScanService {
  private readonly supabase = inject(SupabaseClientService);
  private readonly plan = inject(PlanService);

  readonly scans = signal<ScanEvent[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(false);

  async fetchScanHistory(petId: string, page = 0): Promise<ScanEvent[]> {
    this.loading.set(true);
    try {
      const historyDays = this.plan.limits().scanHistoryDays;
      let query = this.supabase
        .supabase()
        .from('scan_events')
        .select('id,pet_id,tag_code,scanned_at,location_type,ip_city,ip_region,ip_country,ip_lat,ip_lon,message,notified')
        .eq('pet_id', petId)
        .order('scanned_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (historyDays !== null) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - historyDays);
        query = query.gte('scanned_at', cutoff.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const results = (data ?? []) as ScanEvent[];
      if (page === 0) {
        this.scans.set(results);
      } else {
        this.scans.update((prev) => [...prev, ...results]);
      }
      this.hasMore.set(results.length === PAGE_SIZE);
      return results;
    } finally {
      this.loading.set(false);
    }
  }
}
