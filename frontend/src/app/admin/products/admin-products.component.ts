import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Brand, Category, Product } from '../../core/models/product.model';
import { generateSlug } from '../../core/utils/slug.util';
import { AdminProductsService } from './admin-products.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.css',
})
export class AdminProductsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminProductsService);

  readonly state = signal<LoadState>('loading');
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly uploadingFor = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    slug: ['', [Validators.required]],
    description: ['', [Validators.required]],
    sku: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    brandId: ['', [Validators.required]],
    warranty: [null as number | null],
    isActive: [true],
    featured: [false],
  });

  constructor() {
    this.load();
    this.service.findCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
    this.service.findBrands().subscribe({
      next: (res) => this.brands.set(res.data),
    });
  }

  get f() {
    return this.form.controls;
  }

  onNameChange(name: string): void {
    // Ne remplace le slug que s'il n'a pas déjà été modifié à la main
    // (cas simple : uniquement lors d'une création, pas d'une édition).
    if (!this.editingId()) {
      this.form.patchValue({ slug: generateSlug(name) }, { emitEvent: false });
    }
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({
      price: 0,
      stock: 0,
      isActive: true,
      featured: false,
    });
    this.formOpen.set(true);
  }

  openEditForm(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description,
      sku: product.sku ?? '',
      price: +product.price,
      stock: product.stock,
      categoryId: product.category.id,
      brandId: product.brand.id,
      warranty: product.warranty,
      isActive: product.isActive,
      featured: product.featured,
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
      sku: raw.sku || undefined,
      price: raw.price!,
      stock: raw.stock!,
      categoryId: raw.categoryId!,
      brandId: raw.brandId!,
      warranty: raw.warranty ?? undefined,
      isActive: raw.isActive ?? true,
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
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err?.status === 409
            ? 'Ce slug ou SKU est déjà utilisé.'
            : 'Une erreur est survenue. Vérifiez les champs.',
        );
      },
    });
  }

  remove(product: Product): void {
    if (!confirm(`Supprimer « ${product.name} » ?`)) {
      return;
    }
    this.service.remove(product.id).subscribe({
      next: () => this.load(),
    });
  }

  onFileSelected(event: Event, product: Product): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingFor.set(product.id);
    this.service.uploadImage(product.id, file).subscribe({
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

  coverImage(product: Product): string | null {
    return this.coverImageEntity(product)?.url ?? null;
  }

  removeImage(product: Product): void {
    const image = this.coverImageEntity(product);
    if (!image || !confirm('Supprimer cette image ?')) {
      return;
    }

    this.uploadingFor.set(product.id);
    this.service.removeImage(image.id).subscribe({
      next: () => {
        this.uploadingFor.set(null);
        this.load();
      },
      error: () => this.uploadingFor.set(null),
    });
  }

  private coverImageEntity(product: Product) {
    const primary = product.images.find((img) => img.isPrimary);
    return primary ?? product.images[0] ?? null;
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
