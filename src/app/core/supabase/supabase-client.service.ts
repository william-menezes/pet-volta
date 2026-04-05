import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly client: SupabaseClient;

  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.client = isPlatformBrowser(this.platformId)
      ? this.createBrowserClient()
      : this.createServerClient();

    if (isPlatformBrowser(this.platformId)) {
      void this.bootstrapAuthSignals();
    }
  }

  supabase(): SupabaseClient {
    return this.client;
  }

  private createBrowserClient(): SupabaseClient {
    return createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  private createServerClient(): SupabaseClient {
    return createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  private async bootstrapAuthSignals() {
    const { data } = await this.client.auth.getUser();
    this.currentUser.set(data.user ?? null);

    this.client.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }
}

