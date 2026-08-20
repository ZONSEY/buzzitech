import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { PaginationMeta } from '../../core/models/product.model';
import { User } from '../../core/models/user.model';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
  InterventionPerson,
  InterventionStatus,
} from '../../core/models/intervention.model';
import { InterventionsService } from '../../core/services/interventions.service';
import { AdminUsersService } from '../users/admin-users.service';
import { AdminProjetsService } from '../projets/admin-projets.service';
import { ProjectRequest } from '../../core/models/project-request.model';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  LocationPickerComponent,
  PickedLocation,
} from '../../shared/location-picker/location-picker.component';

type LoadState = 'loading' | 'loaded' | 'error';

const STATUSES: InterventionStatus[] = [
  'SCHEDULED',
  'ACCEPTED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

@Component({
  selector: 'app-admin-interventions',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    LocationPickerComponent,
  ],
  templateUrl: './admin-interventions.component.html',
})
export class AdminInterventionsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly interventionsService = inject(InterventionsService);
  private readonly adminUsersService = inject(AdminUsersService);
  private readonly adminProjetsService = inject(AdminProjetsService);

  readonly statuses = STATUSES;
  readonly statusLabels = INTERVENTION_STATUS_LABELS;

  readonly state = signal<LoadState>('loading');
  readonly interventions = signal<Intervention[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly technicians = signal<InterventionPerson[]>([]);
  readonly updatingId = signal<string | null>(null);

  readonly showCreateForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly clientResults = signal<User[]>([]);
  readonly selectedClient = signal<User | null>(null);
  readonly linkableProjects = signal<ProjectRequest[]>([]);
  readonly location = signal<PickedLocation | null>(null);

  readonly filters = this.fb.group({
    search: [''],
    status: [''],
  });

  readonly createForm = this.fb.group({
    title: ['', Validators.required],
    description: [''],
    scheduledAt: ['', Validators.required],
    technicianId: [''],
    addressText: [''],
    clientSearch: [''],
    projectRequestId: [''],
  });

  ngOnInit(): void {
    this.load();

    this.interventionsService.findTechnicians().subscribe({
      next: (list) => this.technicians.set(list),
    });

    this.adminProjetsService.findAll().subscribe({
      next: (projects) => {
        this.linkableProjects.set(
          projects.filter(
            (p) =>
              (p.status === 'APPROVED' || p.status === 'IN_PROGRESS') &&
              !p.intervention,
          ),
        );
      },
    });

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

    this.createForm.controls.projectRequestId.valueChanges.subscribe(
      (projectId) => {
        const project = this.linkableProjects().find(
          (p) => p.id === projectId,
        );
        if (!project) {
          return;
        }
        if (project.user) {
          this.pickClient({
            id: project.user.id,
            nom: project.user.nom,
            prenom: project.user.prenom,
            email: project.user.email,
          } as User);
        }
        this.createForm.patchValue({
          title: project.title,
          addressText: project.locationAddress ?? '',
        });
        if (project.locationLat != null && project.locationLng != null) {
          this.location.set({
            lat: project.locationLat,
            lng: project.locationLng,
            address: project.locationAddress ?? null,
          });
        }
      },
    );
  }

  onLocationChange(location: PickedLocation | null): void {
    this.location.set(location);
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    if (!this.showCreateForm()) {
      this.location.set(null);
      this.selectedClient.set(null);
    }
  }

  pickClient(client: User): void {
    this.selectedClient.set(client);
    this.clientResults.set([]);
    this.createForm.patchValue({ clientSearch: `${client.prenom} ${client.nom}` });
  }

  createIntervention(): void {
    const client = this.selectedClient();
    if (this.createForm.invalid || !client) {
      this.createForm.markAllAsTouched();
      this.createError.set(
        !client ? 'Sélectionnez un client dans la liste.' : null,
      );
      return;
    }

    const raw = this.createForm.getRawValue();
    this.creating.set(true);
    this.createError.set(null);

    const location = this.location();

    this.interventionsService
      .create({
        title: raw.title!,
        description: raw.description || undefined,
        scheduledAt: new Date(raw.scheduledAt!).toISOString(),
        clientId: client.id,
        technicianId: raw.technicianId || undefined,
        addressText: raw.addressText || undefined,
        projectRequestId: raw.projectRequestId || undefined,
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationAddress: location?.address ?? undefined,
      })
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.createForm.reset();
          this.selectedClient.set(null);
          this.location.set(null);
          this.page.set(1);
          this.load();
        },
        error: () => {
          this.creating.set(false);
          this.createError.set("Impossible de créer l'intervention.");
        },
      });
  }

  assignTechnician(intervention: Intervention, technicianId: string): void {
    if (technicianId === (intervention.technicianId ?? '')) {
      return;
    }
    this.updatingId.set(intervention.id);
    this.interventionsService
      .update(intervention.id, { technicianId: technicianId || undefined })
      .subscribe({
        next: (updated) => {
          this.updatingId.set(null);
          this.interventions.update((list) =>
            list.map((i) => (i.id === updated.id ? updated : i)),
          );
        },
        error: () => this.updatingId.set(null),
      });
  }

  cancelIntervention(intervention: Intervention): void {
    if (!confirm(`Annuler la mission « ${intervention.title} » ?`)) {
      return;
    }
    this.updatingId.set(intervention.id);
    this.interventionsService.cancel(intervention.id).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.interventions.update((list) =>
          list.map((i) => (i.id === updated.id ? updated : i)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();

    this.interventionsService
      .findAll({
        page: this.page(),
        search: raw.search || undefined,
        status: (raw.status || undefined) as InterventionStatus | undefined,
      })
      .subscribe({
        next: (res) => {
          this.interventions.set(res.data);
          this.meta.set(res.meta);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }
}
