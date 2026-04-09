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

}

