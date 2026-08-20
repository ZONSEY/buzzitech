import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Brand, Category } from '../../core/models/product.model';
import { BusinessServiceCategory } from '../../core/models/business-service.model';
import { generateSlug } from '../../core/utils/slug.util';
import { IconComponent } from '../../shared/icon/icon.component';
import { AdminCategoriesService } from './admin-categories.service';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminCategoriesService);

  readonly state = signal<LoadState>('loading');
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly serviceCategories = signal<BusinessServiceCategory[]>([]);

  readonly categoryFormOpen = signal(false);
  readonly categorySubmitting = signal(false);
  readonly categoryError = signal<string | null>(null);
  readonly categoryBusyId = signal<string | null>(null);

  readonly brandFormOpen = signal(false);
  readonly brandSubmitting = signal(false);
  readonly brandError = signal<string | null>(null);
  readonly brandBusyId = signal<string | null>(null);

  readonly serviceCategoryFormOpen = signal(false);
  readonly serviceCategorySubmitting = signal(false);
  readonly serviceCategoryError = signal<string | null>(null);
  readonly serviceCategoryBusyId = signal<string | null>(null);

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required]],
    description: [''],
  });

  readonly brandForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required]],
    logo: [''],
  });

  readonly serviceCategoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required]],
    description: [''],
  });

  constructor() {
    this.load();
  }

  get cf() {
    return this.categoryForm.controls;
  }

  get bf() {
    return this.brandForm.controls;
  }

  get scf() {
    return this.serviceCategoryForm.controls;
  }

  onCategoryNameChange(name: string): void {
    this.categoryForm.patchValue({ slug: generateSlug(name) }, { emitEvent: false });
  }

  onBrandNameChange(name: string): void {
    this.brandForm.patchValue({ slug: generateSlug(name) }, { emitEvent: false });
  }

  onServiceCategoryNameChange(name: string): void {
    this.serviceCategoryForm.patchValue(
      { slug: generateSlug(name) },
      { emitEvent: false },
    );
  }

  toggleCategoryForm(): void {
    this.categoryError.set(null);
    this.categoryForm.reset();
    this.categoryFormOpen.update((v) => !v);
  }

  toggleBrandForm(): void {
    this.brandError.set(null);
    this.brandForm.reset();
    this.brandFormOpen.update((v) => !v);
  }

  toggleServiceCategoryForm(): void {
    this.serviceCategoryError.set(null);
    this.serviceCategoryForm.reset();
    this.serviceCategoryFormOpen.update((v) => !v);
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    const raw = this.categoryForm.getRawValue();
    this.categorySubmitting.set(true);
    this.categoryError.set(null);

    this.service
      .createCategory({
        name: raw.name!,
        slug: raw.slug!,
        description: raw.description || undefined,
      })
      .subscribe({
        next: () => {
          this.categorySubmitting.set(false);
          this.categoryFormOpen.set(false);
          this.categoryForm.reset();
          this.load();
        },
        error: (err) => {
          this.categorySubmitting.set(false);
          this.categoryError.set(
            err?.status === 409
              ? 'Ce nom ou ce slug existe déjà.'
              : 'Une erreur est survenue.',
          );
        },
      });
  }

  submitBrand(): void {
    if (this.brandForm.invalid) {
      this.brandForm.markAllAsTouched();
      return;
    }
    const raw = this.brandForm.getRawValue();
    this.brandSubmitting.set(true);
    this.brandError.set(null);

    this.service
      .createBrand({
        name: raw.name!,
        slug: raw.slug!,
        logo: raw.logo || undefined,
      })
      .subscribe({
        next: () => {
          this.brandSubmitting.set(false);
          this.brandFormOpen.set(false);
          this.brandForm.reset();
          this.load();
        },
        error: (err) => {
          this.brandSubmitting.set(false);
          this.brandError.set(
            err?.status === 409
              ? 'Ce nom ou ce slug existe déjà.'
              : 'Une erreur est survenue. Le logo doit être une URL valide.',
          );
        },
      });
  }

  submitServiceCategory(): void {
    if (this.serviceCategoryForm.invalid) {
      this.serviceCategoryForm.markAllAsTouched();
      return;
    }
    const raw = this.serviceCategoryForm.getRawValue();
    this.serviceCategorySubmitting.set(true);
    this.serviceCategoryError.set(null);

    this.service
      .createServiceCategory({
        name: raw.name!,
        slug: raw.slug!,
        description: raw.description || undefined,
      })
      .subscribe({
        next: () => {
          this.serviceCategorySubmitting.set(false);
          this.serviceCategoryFormOpen.set(false);
          this.serviceCategoryForm.reset();
          this.load();
        },
        error: (err) => {
          this.serviceCategorySubmitting.set(false);
          this.serviceCategoryError.set(
            err?.status === 409
              ? 'Ce nom ou ce slug existe déjà.'
              : 'Une erreur est survenue.',
          );
        },
      });
  }

  toggleServiceCategoryActive(category: BusinessServiceCategory): void {
    this.serviceCategoryBusyId.set(category.id);
    this.service.toggleServiceCategoryActive(category.id).subscribe({
      next: () => {
        this.serviceCategoryBusyId.set(null);
        this.load();
      },
      error: () => this.serviceCategoryBusyId.set(null),
    });
  }

  removeServiceCategory(category: BusinessServiceCategory): void {
    if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
      return;
    }
    this.serviceCategoryBusyId.set(category.id);
    this.service.removeServiceCategory(category.id).subscribe({
      next: () => {
        this.serviceCategoryBusyId.set(null);
        this.load();
      },
      error: () => {
        this.serviceCategoryBusyId.set(null);
        alert('Cette catégorie est probablement utilisée par des offres ou réalisations.');
      },
    });
  }

  toggleCategoryActive(category: Category): void {
    this.categoryBusyId.set(category.id);
    this.service.toggleCategoryActive(category).subscribe({
      next: () => {
        this.categoryBusyId.set(null);
        this.load();
      },
      error: () => this.categoryBusyId.set(null),
    });
  }

  removeCategory(category: Category): void {
    if (!confirm(`Supprimer la catégorie « ${category.name} » ?`)) {
      return;
    }
    this.categoryBusyId.set(category.id);
    this.service.removeCategory(category.id).subscribe({
      next: () => {
        this.categoryBusyId.set(null);
        this.load();
      },
      error: () => {
        this.categoryBusyId.set(null);
        alert('Cette catégorie est probablement utilisée par des produits.');
      },
    });
  }

  toggleBrandActive(brand: Brand): void {
    this.brandBusyId.set(brand.id);
    this.service.toggleBrandActive(brand.id).subscribe({
      next: () => {
        this.brandBusyId.set(null);
        this.load();
      },
      error: () => this.brandBusyId.set(null),
    });
  }

  removeBrand(brand: Brand): void {
    if (!confirm(`Supprimer la marque « ${brand.name} » ?`)) {
      return;
    }
    this.brandBusyId.set(brand.id);
    this.service.removeBrand(brand.id).subscribe({
      next: () => {
        this.brandBusyId.set(null);
        this.load();
      },
      error: () => {
        this.brandBusyId.set(null);
        alert('Cette marque est probablement utilisée par des produits.');
      },
    });
  }

  private load(): void {
    this.state.set('loading');
    this.service.findCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
    this.service.findBrands().subscribe({
      next: (res) => this.brands.set(res.data),
    });
    this.service.findServiceCategories().subscribe({
      next: (res) => this.serviceCategories.set(res.data),
    });
  }
}
