import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PetService } from '@core/pets/pet.service';
import { PlanService } from '@core/plan/plan.service';
import { Pet, PetSpecies, PetSize } from '@models/pet.model';
import { UiButtonComponent } from '@ui/button/ui-button.component';
import { UiCardComponent } from '@ui/card/ui-card.component';
import { UiSelectComponent } from '@ui/select/ui-select.component';
import { UiToastService } from '@ui/toast/ui-toast.service';

@Component({
  selector: 'app-pet-form-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, UiButtonComponent, UiCardComponent, UiSelectComponent],
  template: `
    <main class="min-h-dvh bg-surface text-text">
      <header class="hidden border-b border-gray-200 bg-white/80 backdrop-blur md:block">
        <div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a routerLink="/pets" class="text-sm text-gray-600 hover:text-text">← Meus pets</a>
          @if (petId()) {
            <a [routerLink]="['/pets', petId()]" class="text-sm text-primary hover:underline">
              Ver detalhes
            </a>
          }
        </div>
      </header>

      <section class="mx-auto max-w-3xl px-4 py-10">
        <h1 class="font-display text-2xl font-semibold text-text">
          {{ petId() ? 'Editar pet' : 'Novo pet' }}
        </h1>
        <p class="mt-1 text-sm text-gray-600">
          Fotos permitidas no seu plano: {{ photoLimit() }}
        </p>

        <ui-card [className]="'mt-8 p-6'">
          <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="name">Nome</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="species">Espécie</label>
                <ui-select [value]="form.controls.species.value" (valueChange)="onSpeciesChange($event)">
                  <option value="dog">Cachorro</option>
                  <option value="cat">Gato</option>
                  <option value="other">Outro</option>
                </ui-select>
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="size">Porte</label>
                <ui-select [value]="form.controls.size.value" (valueChange)="onSizeChange($event)">
                  <option value="">Não informar</option>
                  <option value="small">Pequeno</option>
                  <option value="medium">Médio</option>
                  <option value="large">Grande</option>
                </ui-select>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="breed">Raça</label>
                <input
                  id="breed"
                  type="text"
                  formControlName="breed"
                  class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="color">Cor</label>
                <input
                  id="color"
                  type="text"
                  formControlName="color"
                  class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="birth_date">Nascimento</label>
                <input
                  id="birth_date"
                  type="date"
                  formControlName="birth_date"
                  class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm font-medium text-text" for="microchip_id">Microchip</label>
                <input
                  id="microchip_id"
                  type="text"
                  formControlName="microchip_id"
                  class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="temperament">Temperamento</label>
              <input
                id="temperament"
                type="text"
                formControlName="temperament"
                class="h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-text" for="medical_notes">Notas médicas</label>
              <textarea
                id="medical_notes"
                rows="4"
                formControlName="medical_notes"
                class="w-full rounded-pet-sm border border-gray-200 bg-white px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              ></textarea>
            </div>

            <div class="rounded-pet border border-gray-200 p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-text">Fotos</p>
                  <p class="mt-1 text-xs text-gray-600">
                    Enviaremos até {{ photoLimit() }} foto(s). Imagens serão comprimidas.
                  </p>
                </div>
                <label class="inline-flex cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-text hover:bg-primary/5">
                  Selecionar
                  <input
                    type="file"
                    class="hidden"
                    accept="image/*"
                    [multiple]="photoLimit() > 1"
                    (change)="onFilesSelected($event)"
                  />
                </label>
              </div>

              @if (selectedFiles().length) {
                <ul class="mt-3 space-y-1 text-xs text-gray-700">
                  @for (f of selectedFiles(); track f.name) {
                    <li>• {{ f.name }}</li>
                  }
                </ul>
              }

              @if (existingPhotos().length) {
                <div class="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  @for (p of existingPhotos(); track p.url) {
                    <img class="aspect-square w-full rounded-pet-sm object-cover" [src]="p.url" alt="Foto do pet" loading="lazy" />
                  }
                </div>
              }
            </div>

            <div class="pt-2">
              <ui-button [className]="'w-full'" type="submit" [disabled]="form.invalid || saving()">
                {{ saving() ? 'Salvando…' : 'Salvar' }}
              </ui-button>
            </div>
          </form>
        </ui-card>
      </section>
    </main>
  `,
})
export class PetFormPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly pets = inject(PetService);
  private readonly plan = inject(PlanService);
  private readonly toast = inject(UiToastService);

  petId = signal<string | null>(null);
  saving = signal(false);
  selectedFiles = signal<File[]>([]);
  existingPhotos = signal<{ url: string; path: string }[]>([]);
  photoLimit = computed(() => this.plan.getPhotoLimit());

  form = this.fb.group({
    name: this.fb.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]),
    species: this.fb.control<PetSpecies>('dog'),
    size: this.fb.control<PetSize | ''>(''),
    breed: this.fb.control<string>(''),
    birth_date: this.fb.control<string>(''),
    color: this.fb.control<string>(''),
    microchip_id: this.fb.control<string>(''),
    temperament: this.fb.control<string>(''),
    medical_notes: this.fb.control<string>(''),
    emergency_visible: this.fb.control(false),
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.petId.set(id);
      void this.load(id);
    }
  }

  async load(id: string) {
    try {
      const pet = await this.pets.getMyPetById(id);
      if (!pet) return;
      this.existingPhotos.set(pet.photos ?? []);
      this.form.patchValue({
        name: pet.name,
        species: pet.species,
        size: (pet.size ?? '') as any,
        breed: pet.breed ?? '',
        birth_date: pet.birth_date ?? '',
        color: pet.color ?? '',
        microchip_id: pet.microchip_id ?? '',
        temperament: pet.temperament ?? '',
        medical_notes: pet.medical_notes ?? '',
        emergency_visible: Boolean(pet.emergency_visible),
      });
    } catch {
      this.toast.show({ message: 'Não foi possível carregar o pet.', kind: 'danger' });
    }
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.selectedFiles.set(files.slice(0, this.photoLimit()));
    input.value = '';
  }

  onSpeciesChange(value: string) {
    if (value === 'dog' || value === 'cat' || value === 'other') {
      this.form.controls.species.setValue(value);
      return;
    }
    this.form.controls.species.setValue('dog');
  }

  onSizeChange(value: string) {
    if (value === '' || value === 'small' || value === 'medium' || value === 'large') {
      this.form.controls.size.setValue(value as PetSize | '');
      return;
    }
    this.form.controls.size.setValue('');
  }

  async submit() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    try {
      const raw = this.form.getRawValue();
      const payload = {
        name: raw.name,
        species: raw.species,
        size: raw.size ? (raw.size as PetSize) : null,
        breed: raw.breed || null,
        birth_date: raw.birth_date || null,
        color: raw.color || null,
        microchip_id: raw.microchip_id || null,
        temperament: raw.temperament || null,
        medical_notes: raw.medical_notes || null,
        emergency_visible: raw.emergency_visible,
      } satisfies Partial<Pet>;

      const files = this.selectedFiles();
      const id = this.petId();

      const saved = id
        ? await this.pets.updatePet(id, { ...payload, photos: files })
        : await this.pets.createPet({ ...(payload as any), photos: files });

      this.toast.show({ message: 'Pet salvo com sucesso.', kind: 'success' });
      await this.router.navigate(['/pets', saved.id]);
    } catch (err: any) {
      const message = String(err?.message ?? '');
      const friendly = message.includes('within_plan_limit')
        ? 'Limite de pets do seu plano atingido.'
        : 'Não foi possível salvar o pet.';
      this.toast.show({ message: friendly, kind: 'danger' });
    } finally {
      this.saving.set(false);
    }
  }
}
