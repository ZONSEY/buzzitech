import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Equipment, PaginatedEquipment } from '../../core/models/equipment.model';
import { User } from '../../core/models/user.model';
import { EquipmentService } from '../../core/services/equipment.service';
import { AdminUsersService } from '../users/admin-users.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-equipements',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-equipements.component.html',
})
export class AdminEquipementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipmentService);
  private readonly adminUsersService = inject(AdminUsersService);

  readonly state = signal<LoadState>('loading');
  readonly equipment = signal<Equipment[]>([]);
  readonly meta = signal<PaginatedEquipment['meta'] | null>(null);
  readonly page = signal(1);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly clientResults = signal<User[]>([]);
  readonly selectedClient = signal<User | null>(null);

  readonly filters = this.fb.group({ search: [''] });

  readonly createForm = this.fb.group({
    name: ['', Validators.required],
    category: [''],
    brand: [''],
    serialNumber: [''],
    warrantyUntil: [''],
    clientSearch: [''],
  });

  ngOnInit(): void {
    this.load();
    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
    this.createForm.controls.clientSearch.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value) => {
        if (!value || value.length < 2) {
          this.clientResults.set([]);
          return;
        }
        this.adminUsersService
          .findAll({ search: value, page: 1 })
          .subscribe({ next: (res) => this.clientResults.set(res.data) });
      });
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
  }

  pickClient(client: User): void {
    this.selectedClient.set(client);
    this.clientResults.set([]);
    this.createForm.patchValue({ clientSearch: `${client.prenom} ${client.nom}` });
  }

  createEquipment(): void {
    const client = this.selectedClient();
    if (this.createForm.invalid || !client) {
      this.createForm.markAllAsTouched();
      this.createError.set(!client ? 'Sélectionnez un client dans la liste.' : null);
      return;
    }
    const raw = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set(null);

    this.service
      .create({
        name: raw.name!,
        category: raw.category || undefined,
        brand: raw.brand || undefined,
        serialNumber: raw.serialNumber || undefined,
        warrantyUntil: raw.warrantyUntil
          ? new Date(raw.warrantyUntil).toISOString()
          : undefined,
        clientId: client.id,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset();
          this.selectedClient.set(null);
          this.page.set(1);
          this.load();
        },
        error: () => {
          this.creating.set(false);
          this.createError.set("Impossible de créer cet équipement.");
        },
      });
  }

  remove(equipment: Equipment): void {
    if (!confirm(`Supprimer « ${equipment.name} » ?`)) {
      return;
    }
    this.updatingId.set(equipment.id);
    this.service.remove(equipment.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => this.updatingId.set(null),
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
        this.equipment.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
