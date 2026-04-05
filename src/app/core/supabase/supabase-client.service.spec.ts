import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';

describe('SupabaseClientService', () => {
  it('creates a client (server platform)', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const service = TestBed.inject(SupabaseClientService);
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.supabase()).toBeTruthy();
  });
});

