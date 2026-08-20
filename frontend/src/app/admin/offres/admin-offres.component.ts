import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  BusinessService,
  BusinessServiceCategory,
} from '../../core/models/business-service.model';
import { generateSlug } from '../../core/utils/slug.util';
import { AdminOffresService } from './admin-offres.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-offres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-offres.component.html',
  styleUrl: './admin-offres.component.css',
})
export class AdminOffresComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminOffresService);

  readonly state = signal<LoadState>('loading');
  readonly services = signal<BusinessService[]>([]);
  readonly categories = signal<BusinessServiceCategory[]>([]);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    slug: ['', [Validators.required]],
    description: ['', [Validators.required]],
    shortDescription: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    estimatedDuration: [null as number | null],
    categoryId: ['', [Validators.required]],
    status: ['AVAILABLE' as 'AVAILABLE' | 'UNAVAILABLE'],
    featured: [false],
  });

  constructor() {
    this.load();
    this.service.findCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
  }

  get f() {
    return this.form.controls;
  }

  onNameChange(name: string): void {
    if (!this.editingId()) {
      this.form.patchValue({ slug: generateSlug(name) }, { emitEvent: false });
    }
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      price: 0,
      status: 'AVAILABLE',
      featured: false,
    });
    this.formOpen.set(true);
  }

  openEditForm(service: BusinessService): void {
    this.editingId.set(service.id);
    this.form.reset({
      name: service.name,
      slug: service.slug,
      description: service.description,
      shortDescription: service.shortDescription ?? '',
      price: +service.price,
      estimatedDuration: service.estimatedDuration,
      categoryId: service.category.id,
      status: service.status,
      featured: service.featured,
    });
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.errorMessage.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto = {
      name: raw.name!,
      slug: raw.slug!,
      description: raw.description!,
      shortDescription: raw.shortDescription || undefined,
      price: raw.price!,
      estimatedDuration: raw.estimatedDuration ?? undefined,
      categoryId: raw.categoryId!,
      status: raw.status ?? 'AVAILABLE',
      featured: raw.featured ?? false,
    };

    this.submitting.set(true);
    this.errorMessage.set(null);

    const editingId = this.editingId();
    const request = editingId
      ? this.service.update(editingId, dto)
      : this.service.create(dto);

    request.subscribe({
      next: () => {
        this.submitting.set(false);
        this.formOpen.set(false);
        this.load();
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Une erreur est survenue. Vérifiez les champs.');
      },
    });
  }

  remove(service: BusinessService): void {
    if (!confirm(`Supprimer « ${service.name} » ?`)) {
      return;
    }
    this.service.remove(service.id).subscribe({
      next: () => this.load(),
    });
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (res) => {
        this.services.set(res.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
