import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Session } from '@supabase/supabase-js';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('tracks authentication state via onAuthStateChange', async () => {
    const callbacks: Array<(event: string, session: Session | null) => void> = [];

    const supabaseAuth = {
      getSession: jasmine
        .createSpy('getSession')
        .and.resolveTo({ data: { session: null } }),
      onAuthStateChange: jasmine
        .createSpy('onAuthStateChange')
        .and.callFake((cb: (event: string, session: Session | null) => void) => {
          callbacks.push(cb);
          return { data: { subscription: { unsubscribe() {} } } };
        }),
      signUp: jasmine.createSpy('signUp'),
      signInWithPassword: jasmine.createSpy('signInWithPassword'),
      signInWithOAuth: jasmine.createSpy('signInWithOAuth'),
      resetPasswordForEmail: jasmine.createSpy('resetPasswordForEmail'),
      updateUser: jasmine.createSpy('updateUser'),
      signOut: jasmine.createSpy('signOut'),
    };

    const supabaseStub = { auth: supabaseAuth };

    const supabaseClientStub: Pick<SupabaseClientService, 'currentUser' | 'supabase'> =
      {
        currentUser: signal(null),
        supabase: () => supabaseStub as any,
      };

    TestBed.configureTestingModule({
      providers: [{ provide: SupabaseClientService, useValue: supabaseClientStub }],
    });

    const service = TestBed.inject(AuthService);
    expect(service.isAuthenticated()).toBeFalse();

    // bootstrapSessionSignals() runs async in the constructor.
    for (let i = 0; i < 5 && callbacks.length === 0; i++) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.resolve();
    }
    expect(callbacks.length).toBeGreaterThan(0);

    const fakeSession = {
      user: { id: 'u1', email: 'test@example.com' },
    } as unknown as Session;

    callbacks[0]?.('SIGNED_IN', fakeSession);

    expect(service.isAuthenticated()).toBeTrue();
    expect(supabaseClientStub.currentUser()?.email).toBe('test@example.com');
  });
});
