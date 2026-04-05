import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/auth.service';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  it('exposes limits based on currentPlan', () => {
    const authStub: Pick<AuthService, 'currentSession'> = {
      currentSession: signal(null),
    } as any;

    const supabaseStub: Pick<SupabaseClientService, 'supabase'> = {
      supabase: () =>
        ({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: { message: 'nope' } }),
              }),
            }),
          }),
        }) as any,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: SupabaseClientService, useValue: supabaseStub },
      ],
    });

    const service = TestBed.inject(PlanService);
    service.currentPlan.set('elite');
    expect(service.getPhotoLimit()).toBe(10);
    expect(service.canAddPet(2)).toBeTrue();
    expect(service.canAddPet(3)).toBeFalse();
    expect(service.hasTagAccess()).toBeTrue();
  });
});

