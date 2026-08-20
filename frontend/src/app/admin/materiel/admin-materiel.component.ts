import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MaterialItem } from '../../core/models/material-item.model';
import { MaterialItemsService } from '../../core/services/material-items.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-materiel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-materiel.component.html',
})
export class AdminMaterielComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaterialItemsService);

  readonly state = signal<LoadState>('loading');
  readonly items = signal<MaterialItem[]>([]);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly uploadingFor = signal<string | null>(null);
  readonly stockDrafts = new Map<string, number>();

  readonly filters = this.fb.group({
    search: [''],
  });

  readonly createForm = this.fb.group({
    name: ['', Validators.required],
    unit: [''],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    minStockAlert: [null as number | null],
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => this.load());
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
  }

  createItem(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set(null);

    this.service
      .create({
        name: raw.name!,
        unit: raw.unit || undefined,
        stockQuantity: raw.stockQuantity ?? 0,
        minStockAlert: raw.minStockAlert ?? undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({ stockQuantity: 0 });
          this.load();
        },
        error: () => {
          this.creating.set(false);
          this.createError.set("Impossible de créer l'article (nom déjà utilisé ?).");
        },
      });
  }

  stockDraft(item: MaterialItem): number {
    return this.stockDrafts.has(item.id)
      ? this.stockDrafts.get(item.id)!
      : item.stockQuantity;
  }

  onStockInput(item: MaterialItem, value: string): void {
    this.stockDrafts.set(item.id, Number(value));
  }

  saveStock(item: MaterialItem): void {
    const value = this.stockDrafts.get(item.id);
    if (value === undefined || value === item.stockQuantity) {
      return;
    }
    this.updatingId.set(item.id);
    this.service.update(item.id, { stockQuantity: value }).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.stockDrafts.delete(item.id);
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  toggleActive(item: MaterialItem): void {
    this.updatingId.set(item.id);
    this.service.update(item.id, { isActive: !item.isActive }).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  remove(item: MaterialItem): void {
    if (!confirm(`Supprimer « ${item.name} » du catalogue ?`)) {
      return;
    }
    this.updatingId.set(item.id);
    this.service.remove(item.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => {
        this.updatingId.set(null);
        alert("Cet article a déjà été utilisé dans des interventions : désactivez-le plutôt.");
      },
    });
  }

  onFileSelected(event: Event, item: MaterialItem): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploadingFor.set(item.id);
    this.service.uploadImage(item.id, file).subscribe({
      next: (updated) => {
        this.uploadingFor.set(null);
        input.value = '';
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i)),
        );
      },
      error: () => {
        this.uploadingFor.set(null);
        input.value = '';
      },
    });
  }

  removeImage(item: MaterialItem): void {
    if (!confirm('Supprimer cette image ?')) {
      return;
    }
    this.uploadingFor.set(item.id);
    this.service.removeImage(item.id).subscribe({
      next: (updated) => {
        this.uploadingFor.set(null);
        this.items.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i)),
        );
      },
      error: () => this.uploadingFor.set(null),
    });
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();
    this.service.findAll({ search: raw.search || undefined }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
