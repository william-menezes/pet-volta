import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/auth.service';
import { environment } from '@env/environment';

export type ActivateTagResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly auth = inject(AuthService);

  async activateTag(payload: { tagCode: string; petId: string }): Promise<ActivateTagResult> {
    const token = this.auth.currentSession()?.access_token;
    if (!token) {
      return { ok: false, code: 'UNAUTHENTICATED', message: 'Faça login para ativar a tag.' };
    }

    const url = `${environment.supabaseUrl}/functions/v1/activate-tag`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: environment.supabaseAnonKey,
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { ok: true };
    }

    let body: any = null;
    try {
      body = await response.json();
    } catch {
      // ignore
    }
    return {
      ok: false,
      code: body?.code ?? 'ERROR',
      message: body?.message ?? 'Não foi possível ativar a tag.',
    };
  }
}
