import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import {
  CONTRACT_FREQUENCY_LABELS,
  ContractFrequency,
  MaintenanceContract,
  PaginatedMaintenanceContracts,
} from '../../core/models/maintenance-contract.model';
import { User } from '../../core/models/user.model';
import { MaintenanceContractsService } from '../../core/services/maintenance-contracts.service';
import { AdminUsersService } from '../users/admin-users.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-maintenance-contracts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-maintenance-contracts.component.html',
})
export class AdminMaintenanceContractsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(MaintenanceContractsService);
  private readonly adminUsersService = inject(AdminUsersService);

  readonly state = signal<LoadState>('loading');
  readonly contracts = signal<MaintenanceContract[]>([]);
  readonly meta = signal<PaginatedMaintenanceContracts['meta'] | null>(null);
  readonly page = signal(1);
  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly generating = signal(false);
  readonly generateResult = signal<string | null>(null);
  readonly clientResults = signal<User[]>([]);
  readonly selectedClient = signal<User | null>(null);
  readonly technicianResults = signal<User[]>([]);
  readonly selectedTechnician = signal<User | null>(null);

  readonly frequencyLabels = CONTRACT_FREQUENCY_LABELS;
  readonly frequencies: ContractFrequency[] = ['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL'];

  readonly filters = this.fb.group({ search: [''] });

  readonly createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    frequency: ['MONTHLY' as ContractFrequency, Validators.required],
    startDate: [''],
    endDate: [''],
    clientSearch: [''],
    technicianSearch: [''],
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
          .findAll({ search: value, role: 'CLIENT', page: 1 })
          .subscribe({ next: (res) => this.clientResults.set(res.data) });
      });
    this.createForm.controls.technicianSearch.valueChanges
      .pipe(debounceTime(300))
      .subscribe((value) => {
        if (!value || value.length < 2) {
          this.technicianResults.set([]);
          return;
        }
        this.adminUsersService
          .findAll({ search: value, role: 'TECHNICIEN', page: 1 })
          .subscribe({ next: (res) => this.technicianResults.set(res.data) });
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

  pickTechnician(technician: User): void {
    this.selectedTechnician.set(technician);
    this.technicianResults.set([]);
    this.createForm.patchValue({ technicianSearch: `${technician.prenom} ${technician.nom}` });
  }

  createContract(): void {
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
        title: raw.title!,
        description: raw.description || undefined,
        frequency: raw.frequency!,
        startDate: raw.startDate ? new Date(raw.startDate).toISOString() : undefined,
        endDate: raw.endDate ? new Date(raw.endDate).toISOString() : undefined,
        clientId: client.id,
        technicianId: this.selectedTechnician()?.id,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset({ frequency: 'MONTHLY' });
          this.selectedClient.set(null);
          this.selectedTechnician.set(null);
          this.page.set(1);
          this.load();
        },
        error: () => {
          this.creating.set(false);
          this.createError.set('Impossible de créer ce contrat.');
        },
      });
  }

  toggleActive(contract: MaintenanceContract): void {
    this.updatingId.set(contract.id);
    this.service.update(contract.id, { isActive: !contract.isActive }).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => this.updatingId.set(null),
    });
  }

  remove(contract: MaintenanceContract): void {
    if (!confirm(`Supprimer le contrat « ${contract.title} » ?`)) {
      return;
    }
    this.updatingId.set(contract.id);
    this.service.remove(contract.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => this.updatingId.set(null),
    });
  }

  generateDue(): void {
    this.generating.set(true);
    this.generateResult.set(null);
    this.service.generateDue().subscribe({
      next: (res) => {
        this.generating.set(false);
        this.generateResult.set(
          res.generated > 0
            ? `${res.generated} intervention(s) générée(s).`
            : 'Aucun contrat dû pour le moment.',
        );
        this.load();
      },
      error: () => {
        this.generating.set(false);
        this.generateResult.set('Échec de la génération.');
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
        this.contracts.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
