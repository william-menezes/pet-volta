import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';

export type PlanTier = 'digital' | 'essential' | 'elite' | 'guardian';

export const PLAN_LIMITS: Record<
  PlanTier,
  {
    maxPets: number;
    maxPhotosPerPet: number;
    hasTagAccess: boolean;
  }
> = {
  digital: { maxPets: 1, maxPhotosPerPet: 1, hasTagAccess: false },
  essential: { maxPets: 1, maxPhotosPerPet: 2, hasTagAccess: true },
  elite: { maxPets: 3, maxPhotosPerPet: 10, hasTagAccess: true },
  guardian: { maxPets: 5, maxPhotosPerPet: 10, hasTagAccess: true },
};

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);

  readonly currentPlan = signal<PlanTier>('digital');
  readonly limits = computed(() => PLAN_LIMITS[this.currentPlan()]);

  constructor() {
    effect(() => {
      const userId = this.auth.currentSession()?.user.id ?? null;
      if (!userId) {
        this.currentPlan.set('digital');
        return;
      }
      void this.loadCurrentPlan(userId);
    });
  }

  canAddPet(currentPetCount: number) {
    return currentPetCount < this.limits().maxPets;
  }

  getPhotoLimit() {
    return this.limits().maxPhotosPerPet;
  }

  hasTagAccess() {
    return this.limits().hasTagAccess;
  }

  private async loadCurrentPlan(userId: string) {
    const { data, error } = await this.supabase
      .supabase()
      .from('profiles')
      .select('plan_tier')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data?.plan_tier) {
      return;
    }

    this.currentPlan.set(data.plan_tier as PlanTier);
  }
}

