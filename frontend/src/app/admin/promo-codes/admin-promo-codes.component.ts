import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import {
  DiscountType,
  PaginatedPromoCodes,
  PromoCode,
} from '../../core/models/promo-code.model';
import { PromoCodesService } from '../../core/services/promo-codes.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-promo-codes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-promo-codes.component.html',
})
export class AdminPromoCodesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PromoCodesService);

  readonly state = signal<LoadState>('loading');
  readonly promoCodes = signal<PromoCode[]>([]);
  readonly meta = signal<PaginatedPromoCodes['meta'] | null>(null);
  readonly page = signal(1);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);

  readonly filters = this.fb.group({ search: [''] });

  readonly createForm = this.fb.group({
    code: ['', Validators.required],
    description: [''],
    discountType: ['PERCENTAGE' as DiscountType, Validators.required],
    discountValue: [10, [Validators.required, Validators.min(1)]],
    minOrderAmount: [null as number | null],
    maxUses: [null as number | null],
    maxUsesPerUser: [1],
    expiresAt: [''],
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
  }

  createPromoCode(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }
    const raw = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set(null);

    this.service
      .create({
        code: raw.code!,
        description: raw.description || undefined,
        discountType: raw.discountType!,
        discountValue: raw.discountValue!,
        minOrderAmount: raw.minOrderAmount ?? undefined,
        maxUses: raw.maxUses ?? undefined,
        maxUsesPerUser: raw.maxUsesPerUser ?? undefined,
        expiresAt: raw.expiresAt
          ? new Date(raw.expiresAt).toISOString()
          : undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({ discountType: 'PERCENTAGE', discountValue: 10, maxUsesPerUser: 1 });
          this.load();
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(
            err?.error?.message ?? 'Impossible de créer ce code promo.',
          );
        },
      });
  }

  toggleActive(promoCode: PromoCode): void {
    this.updatingId.set(promoCode.id);
    this.service.update(promoCode.id, { isActive: !promoCode.isActive }).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.promoCodes.update((list) =>
          list.map((p) => (p.id === updated.id ? updated : p)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  remove(promoCode: PromoCode): void {
    if (!confirm(`Supprimer le code « ${promoCode.code} » ?`)) {
      return;
    }
    this.updatingId.set(promoCode.id);
    this.service.remove(promoCode.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => {
        this.updatingId.set(null);
        alert('Ce code a déjà été utilisé : désactivez-le plutôt que de le supprimer.');
      },
    });
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();
    this.service.findAll(this.page(), raw.search || undefined).subscribe({
      next: (res) => {
        this.promoCodes.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
