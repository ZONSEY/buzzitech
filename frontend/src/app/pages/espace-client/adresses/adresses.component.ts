import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Address } from '../../../core/models/order.model';
import { AddressesService } from '../../../core/services/addresses.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-adresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './adresses.component.html',
  styleUrl: './adresses.component.css',
})
export class AdressesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AddressesService);

  readonly state = signal<LoadState>('loading');
  readonly addresses = signal<Address[]>([]);
  readonly formOpen = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    recipient: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    country: ['Burkina Faso', [Validators.required]],
    city: ['', [Validators.required]],
    address: ['', [Validators.required]],
    postalCode: [''],
    isDefault: [false],
  });

  constructor() {
    this.load();
  }

  get f() {
    return this.form.controls;
  }

  openForm(): void {
    this.form.reset({ country: 'Burkina Faso', isDefault: false });
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
    this.submitting.set(true);
    this.errorMessage.set(null);

    this.service
      .create({
        label: raw.label!,
        recipient: raw.recipient!,
        phone: raw.phone!,
        country: raw.country!,
        city: raw.city!,
        address: raw.address!,
        postalCode: raw.postalCode || undefined,
        isDefault: raw.isDefault ?? false,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.formOpen.set(false);
          this.load();
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Une erreur est survenue.');
        },
      });
  }

  setDefault(address: Address): void {
    this.service.setDefault(address.id).subscribe({ next: () => this.load() });
  }

  remove(address: Address): void {
    if (!confirm(`Supprimer l'adresse « ${address.label} » ?`)) {
      return;
    }
    this.service.remove(address.id).subscribe({ next: () => this.load() });
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
