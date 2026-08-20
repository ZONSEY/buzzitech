import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessServiceCategory } from '../../core/models/business-service.model';
import { Realisation, RealisationImage } from '../../core/models/realisation.model';
import { AdminRealisationsService } from './admin-realisations.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-realisations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-realisations.component.html',
  styleUrl: './admin-realisations.component.css',
})
export class AdminRealisationsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminRealisationsService);

  readonly state = signal<LoadState>('loading');
  readonly realisations = signal<Realisation[]>([]);
  readonly categories = signal<BusinessServiceCategory[]>([]);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly uploadingFor = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required]],
    shortDescription: ['', [Validators.maxLength(300)]],
    clientName: [''],
    location: [''],
    completedAt: [''],
    categoryId: [''],
    featured: [false],
    isActive: [true],
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

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ featured: false, isActive: true });
    this.formOpen.set(true);
  }

  openEditForm(realisation: Realisation): void {
    this.editingId.set(realisation.id);
    this.form.reset({
      title: realisation.title,
      description: realisation.description,
      shortDescription: realisation.shortDescription ?? '',
      clientName: realisation.clientName ?? '',
      location: realisation.location ?? '',
      completedAt: realisation.completedAt
        ? realisation.completedAt.substring(0, 10)
        : '',
      categoryId: realisation.category?.id ?? '',
      featured: realisation.featured,
      isActive: realisation.isActive,
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
      title: raw.title!,
      description: raw.description!,
      shortDescription: raw.shortDescription || undefined,
      clientName: raw.clientName || undefined,
      location: raw.location || undefined,
      completedAt: raw.completedAt || undefined,
      categoryId: raw.categoryId || undefined,
      featured: raw.featured ?? false,
      isActive: raw.isActive ?? true,
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

  remove(realisation: Realisation): void {
    if (!confirm(`Supprimer « ${realisation.title} » ?`)) {
      return;
    }
    this.service.remove(realisation.id).subscribe({
      next: () => this.load(),
    });
  }

  onFileSelected(event: Event, realisation: Realisation): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingFor.set(realisation.id);
    this.service.uploadImage(realisation.id, file).subscribe({
      next: () => {
        this.uploadingFor.set(null);
        input.value = '';
        this.load();
      },
      error: () => {
        this.uploadingFor.set(null);
        input.value = '';
      },
    });
  }

  sortedImages(realisation: Realisation) {
    return [...realisation.images].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) {
        return a.isPrimary ? -1 : 1;
      }
      return a.displayOrder - b.displayOrder;
    });
  }

  removeGalleryImage(image: RealisationImage, realisation: Realisation): void {
    if (!confirm('Supprimer cette photo ?')) {
      return;
    }

    this.uploadingFor.set(realisation.id);
    this.service.removeImage(image.id).subscribe({
      next: () => {
        this.uploadingFor.set(null);
        this.load();
      },
      error: () => this.uploadingFor.set(null),
    });
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (res) => {
        this.realisations.set(res.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
