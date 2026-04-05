import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, computed, effect, inject, Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly supabaseClient = inject(SupabaseClientService);

  readonly currentSession = signal<Session | null>(null);
  readonly isAuthenticated = computed(() => Boolean(this.currentSession()?.user));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.bootstrapSessionSignals();
    }

    effect(() => {
      const session = this.currentSession();
      if (!session) {
        this.supabaseClient.currentUser.set(null);
        return;
      }

      this.supabaseClient.currentUser.set(session.user);
    });
  }

  async signUp(payload: { fullName: string; email: string; password: string }) {
    return this.supabaseClient.supabase().auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { full_name: payload.fullName },
      },
    });
  }

  async signIn(payload: { email: string; password: string }) {
    return this.supabaseClient.supabase().auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
  }

  async signInWithGoogle() {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Google OAuth disponível apenas no browser.');
    }

    const appUrl = environment.appUrl || window.location.origin;
    sessionStorage.setItem('pv_post_auth_redirect', '/dashboard');

    return this.supabaseClient.supabase().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/auth/callback`,
      },
    });
  }

  async resetPassword(email: string) {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Reset de senha disponível apenas no browser.');
    }

    const appUrl = environment.appUrl || window.location.origin;
    return this.supabaseClient.supabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset`,
    });
  }

  async updatePassword(newPassword: string) {
    return this.supabaseClient.supabase().auth.updateUser({ password: newPassword });
  }

  async signOut() {
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('pv_post_auth_redirect');
    }
    return this.supabaseClient.supabase().auth.signOut();
  }

  private async bootstrapSessionSignals() {
    const { data } = await this.supabaseClient.supabase().auth.getSession();
    this.currentSession.set(data.session ?? null);

    this.supabaseClient.supabase().auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
    });
  }
}

