import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { SupabaseClientService } from '@core/supabase/supabase-client.service';
import { CurrencyBrlPipe } from '@shared/pipes/currency-brl.pipe';
import { UiButtonComponent } from '@ui/button/ui-button.component';

type PublicPet = {
  id: string;
  public_slug: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string | null;
  size: 'small' | 'medium' | 'large' | null;
  status: 'safe' | 'lost';
  lost_since: string | null;
  lost_description: string | null;
  reward_amount_cents: number;
  photos: Array<{ url: string; path: string }>;
  /** Informações do tutor (unidas na query) */
  tutor_name: string | null;
  tutor_phone: string | null;
  tutor_city: string | null;
  tutor_state: string | null;
  tutor_show_phone: boolean;
  /** Tag vinculada, se houver */
  tag_code: string | null;
};

type GeoState = 'idle' | 'requesting' | 'granted' | 'denied' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-public-pet-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, UiButtonComponent, CurrencyBrlPipe],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <!-- Header mínimo -->
      <header class="border-b border-gray-200 bg-white">
        <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <a routerLink="/" class="font-display text-base font-semibold text-text">🐾 Pet Volta</a>
          <a routerLink="/auth/login" class="text-sm text-primary hover:underline">Login</a>
        </div>
      </header>

      <section class="mx-auto max-w-2xl px-4 py-8">

        <!-- Loading -->
        @if (loading()) {
          <div class="flex flex-col gap-4">
            <div class="h-72 animate-pulse rounded-pet bg-gray-200"></div>
            <div class="h-8 w-48 animate-pulse rounded-full bg-gray-200"></div>
            <div class="h-4 w-32 animate-pulse rounded-full bg-gray-200"></div>
          </div>
        }

        <!-- Pet não encontrado -->
        @else if (!pet()) {
          <div class="rounded-pet border border-gray-200 bg-white p-8 text-center shadow-pet">
            <p class="text-4xl">🐾</p>
            <h1 class="mt-4 font-display text-xl font-semibold text-text">Pet não encontrado</h1>
            <p class="mt-2 text-sm text-gray-600">
              Esta tag não está vinculada a nenhum pet. Verifique o link.
            </p>
            <a routerLink="/auth/register" class="mt-6 block">
              <ui-button type="button" [className]="'w-full rounded-full'">
                Criar perfil grátis
              </ui-button>
            </a>
          </div>
        }

        <!-- Pet encontrado -->
        @else {
          <!-- ===== MODO ALERTA (pet lost) ===== -->
          @if (pet()!.status === 'lost') {
            <div
              class="mb-6 rounded-pet bg-danger p-5 text-white shadow-pet-md"
              role="alert"
              aria-live="assertive"
            >
              <p class="text-lg font-bold">⚠️ {{ pet()!.name }} está perdido!</p>
              @if (pet()!.lost_since) {
                <p class="mt-1 text-sm text-white/80">
                  Desde {{ formatDate(pet()!.lost_since!) }}
                </p>
              }
              <p class="mt-2 text-sm text-white/90">
                Ajude a devolvê-lo ao tutor. Sua notificação pode fazer toda a diferença.
              </p>
            </div>
          }

          <!-- Foto do pet -->
          <div class="overflow-hidden rounded-pet bg-gray-100 shadow-pet">
            @if (pet()!.photos.length) {
              <img
                class="h-72 w-full object-cover"
                [src]="pet()!.photos[0].url"
                [alt]="'Foto de ' + pet()!.name"
                loading="eager"
              />
            } @else {
              <div class="grid h-72 place-items-center text-7xl text-gray-300">🐾</div>
            }
          </div>

          <!-- Nome e dados básicos -->
          <div class="mt-5">
            <h1 class="font-display text-3xl font-semibold text-text">{{ pet()!.name }}</h1>
            <p class="mt-1 text-sm text-gray-600">
              {{ mapSpecies(pet()!.species) }}
              @if (pet()!.breed) { • {{ pet()!.breed }} }
              @if (pet()!.size) { • Porte {{ mapSize(pet()!.size) }} }
            </p>
            @if (pet()!.tutor_city) {
              <p class="mt-1 text-xs text-gray-500">
                Tutor em {{ pet()!.tutor_city }}{{ pet()!.tutor_state ? ', ' + pet()!.tutor_state : '' }}
              </p>
            }
          </div>

          <!-- ===== BADGE DE RECOMPENSA (só se lost + reward > 0) ===== -->
          @if (pet()!.status === 'lost' && pet()!.reward_amount_cents > 0) {
            <div
              class="mt-5 rounded-pet bg-secondary p-5 shadow-pet"
              aria-label="Recompensa disponível"
            >
              <p class="text-xs font-semibold uppercase tracking-wider text-white/80">🎁 Recompensa</p>
              <p class="mt-1 font-display text-3xl font-bold text-white">
                {{ pet()!.reward_amount_cents | currencyBrl }}
              </p>
              <p class="mt-2 text-xs text-white/70">
                Oferecida diretamente pelo tutor. Pet Volta não intermedia pagamentos.
              </p>
            </div>
          }

          <!-- ===== DESCRIÇÃO DO DESAPARECIMENTO ===== -->
          @if (pet()!.status === 'lost' && pet()!.lost_description) {
            <div class="mt-5 rounded-pet-sm border border-gray-200 bg-white p-4 shadow-pet">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">Última vez visto</p>
              <p class="mt-2 text-sm text-gray-700">{{ pet()!.lost_description }}</p>
            </div>
          }

          <!-- ===== CONTATO DO TUTOR ===== -->
          <div class="mt-6 flex flex-col gap-3">
            @if (pet()!.tutor_show_phone && pet()!.tutor_phone) {
              <a [href]="'tel:' + pet()!.tutor_phone">
                <ui-button type="button" [className]="'w-full rounded-full'">
                  📞 Ligar para o Tutor
                </ui-button>
              </a>
              <a [href]="whatsappLink()">
                <ui-button variant="ghost" type="button" [className]="'w-full rounded-full'">
                  💬 WhatsApp
                </ui-button>
              </a>
            } @else {
              <div class="rounded-pet-sm border border-gray-200 bg-white p-4 text-center text-sm text-gray-600 shadow-pet">
                O tutor optou por não exibir o contato publicamente.
              </div>
            }
          </div>

          <!-- ===== SEÇÃO DE GEOLOC (só se pet lost e tag vinculada) ===== -->
          @if (pet()!.status === 'lost' && pet()!.tag_code) {
            <div class="mt-6 rounded-pet border border-gray-200 bg-white p-5 shadow-pet">
              <h2 class="font-semibold text-text">Onde você encontrou {{ pet()!.name }}?</h2>
              <p class="mt-1 text-sm text-gray-600">
                Ajude o tutor informando sua localização.
              </p>

              <!-- Mensagem do encontrador -->
              <textarea
                class="mt-3 w-full rounded-pet-sm border border-gray-200 p-3 text-sm text-text focus:border-primary focus:outline-none"
                rows="3"
                placeholder="Ex: Parque da Aclimação, perto do lago…"
                [value]="finderMessage()"
                (input)="finderMessage.set($any($event.target).value)"
                maxlength="300"
              ></textarea>

              <!-- Estado da geoloc -->
              @switch (geoState()) {
                @case ('idle') {
                  <ui-button
                    type="button"
                    [className]="'mt-3 w-full rounded-full'"
                    (click)="requestGeoAndSend()"
                  >
                    📍 Compartilhar Localização e Notificar Tutor
                  </ui-button>
                  <p class="mt-2 text-center text-xs text-gray-500">
                    Sua localização só é usada para notificar o tutor (LGPD).
                  </p>
                }
                @case ('requesting') {
                  <div class="mt-3 text-center text-sm text-gray-600">Solicitando localização…</div>
                }
                @case ('sending') {
                  <div class="mt-3 text-center text-sm text-gray-600">Enviando notificação…</div>
                }
                @case ('sent') {
                  <div
                    class="mt-3 rounded-pet-sm bg-success/10 p-3 text-center text-sm font-medium text-success"
                    role="status"
                  >
                    ✅ Tutor notificado com sucesso! Obrigado por ajudar.
                  </div>
                }
                @case ('denied') {
                  <ui-button
                    type="button"
                    variant="ghost"
                    [className]="'mt-3 w-full rounded-full'"
                    (click)="sendWithIpFallback()"
                  >
                    📌 Notificar sem compartilhar localização exata
                  </ui-button>
                  <p class="mt-1 text-center text-xs text-gray-500">
                    Sua localização aproximada (cidade) será obtida via IP.
                  </p>
                }
                @case ('error') {
                  <div class="mt-3 text-center text-xs text-danger">
                    Erro ao enviar. Tente ligar diretamente para o tutor.
                  </div>
                }
              }
            </div>
          }

          <!-- Footer da página -->
          <p class="mt-10 text-center text-xs text-gray-400">
            Perfil gerado via <a routerLink="/" class="hover:underline">Pet Volta</a> — Segurança pet com QR Code
          </p>
        }
      </section>
    </main>
  `,
})
export class PublicPetPage {
  private readonly route = inject(ActivatedRoute);
  private readonly supabase = inject(SupabaseClientService);
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);

  /** Resolve slug (rota /p/:slug) ou tagCode (rota /t/:tagCode) */
  private readonly slug = computed(
    () => this.route.snapshot.paramMap.get('slug') ?? '',
  );
  private readonly tagCode = computed(
    () => this.route.snapshot.paramMap.get('tagCode') ?? '',
  );

  loading = signal(true);
  pet = signal<PublicPet | null>(null);
  geoState = signal<GeoState>('idle');
  finderMessage = signal('');

  whatsappLink = computed(() => {
    const phone = this.pet()?.tutor_phone?.replace(/\D/g, '') ?? '';
    const petName = this.pet()?.name ?? 'seu pet';
    const msg = encodeURIComponent(`Olá! Encontrei o(a) ${petName} e estou entrando em contato pelo Pet Volta.`);
    return `https://wa.me/55${phone}?text=${msg}`;
  });

  constructor() {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      let data: PublicPet | null = null;

      if (this.tagCode()) {
        // Carrega por tagCode (rota /t/:tagCode)
        const result = await this.supabase
          .supabase()
          .rpc('get_public_pet_by_tag', { p_tag_code: this.tagCode() })
          .maybeSingle();
        data = (result.data ?? null) as PublicPet | null;
      } else {
        // Carrega por slug (rota /p/:slug)
        const result = await this.supabase
          .supabase()
          .rpc('get_public_pet_by_slug', { slug: this.slug() })
          .maybeSingle();
        data = (result.data ?? null) as PublicPet | null;
      }

      this.pet.set(data);

      if (data) {
        this.titleService.setTitle(`${data.name} — Pet Volta`);
        this.meta.updateTag({ name: 'description', content: `Perfil público de ${data.name}. Se você encontrou este pet, entre em contato com o tutor.` });
        this.meta.updateTag({ property: 'og:title', content: `${data.name} — Pet Volta` });
        this.meta.updateTag({ property: 'og:description', content: `Encontrei ${data.name}! Clique para ver o perfil e contato do tutor.` });
      }
    } finally {
      this.loading.set(false);
    }
  }

  /** Solicita geoloc do browser e envia o scan */
  requestGeoAndSend() {
    if (!('geolocation' in navigator)) {
      void this.sendWithIpFallback();
      return;
    }

    this.geoState.set('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.geoState.set('sending');
        void this.sendScan({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Permissão negada — usa fallback por IP
        this.geoState.set('denied');
      },
      { timeout: 10_000, maximumAge: 60_000 },
    );
  }

  /** Envia scan sem geoloc precisa (Edge Function extrai IP) */
  async sendWithIpFallback() {
    this.geoState.set('sending');
    await this.sendScan({ ipFallback: true });
  }

  private async sendScan(opts: { lat?: number; lng?: number; ipFallback?: boolean }) {
    try {
      const tagCode = this.pet()?.tag_code;
      if (!tagCode) {
        this.geoState.set('error');
        return;
      }

      const body: Record<string, unknown> = {
        tagCode,
        message: this.finderMessage() || undefined,
        ipLocationFallback: opts.ipFallback ?? false,
      };
      if (opts.lat != null) {
        body['lat'] = opts.lat;
        body['lng'] = opts.lng;
      }

      const { functions } = this.supabase.supabase();
      const { error } = await functions.invoke('scan', { body });

      this.geoState.set(error ? 'error' : 'sent');
    } catch {
      this.geoState.set('error');
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  mapSpecies(species: string): string {
    switch (species) {
      case 'dog': return 'Cachorro';
      case 'cat': return 'Gato';
      default:    return 'Outro';
    }
  }

  mapSize(size: string | null): string {
    switch (size) {
      case 'small':  return 'Pequeno';
      case 'medium': return 'Médio';
      case 'large':  return 'Grande';
      default:       return '—';
    }
  }
}
