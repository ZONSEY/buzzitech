import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InterventionsService } from '../../core/services/interventions.service';
import { MaterialItemsService } from '../../core/services/material-items.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { SignaturePadComponent } from '../../shared/signature-pad/signature-pad.component';
import { LocationPickerComponent } from '../../shared/location-picker/location-picker.component';
import { downloadBase64File } from '../../shared/utils/download-base64.util';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
} from '../../core/models/intervention.model';
import { MaterialItem } from '../../core/models/material-item.model';
import { Equipment } from '../../core/models/equipment.model';

@Component({
  selector: 'app-technicien-mission-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    SignaturePadComponent,
    LocationPickerComponent,
  ],
  templateUrl: './technicien-mission-detail.component.html',
})
export class TechnicienMissionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly interventionsService = inject(InterventionsService);
  private readonly materialItemsService = inject(MaterialItemsService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly fb = inject(FormBuilder);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly mission = signal<Intervention | null>(null);
  readonly accepting = signal(false);
  readonly settingOnTheWay = signal(false);
  readonly starting = signal(false);
  readonly savingObservations = signal(false);
  readonly addingMaterial = signal(false);
  readonly uploadingPhoto = signal(false);
  readonly completing = signal(false);
  readonly downloadingReport = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly catalog = signal<MaterialItem[]>([]);
  readonly clientSignature = signal<string | null>(null);
  readonly clientEquipment = signal<Equipment[]>([]);
  readonly showEquipmentForm = signal(false);
  readonly addingEquipment = signal(false);

  readonly observationsForm = this.fb.group({
    observations: [''],
  });

  readonly materialForm = this.fb.group({
    materialItemId: [''],
    name: [''],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  readonly equipmentForm = this.fb.group({
    name: ['', Validators.required],
    category: [''],
    brand: [''],
    serialNumber: [''],
    warrantyUntil: [''],
  });

  readonly completeForm = this.fb.group({
    report: ['', Validators.required],
    actualDuration: [null as number | null],
  });

  private missionId(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  mapsUrl(mission: Intervention): string | null {
    if (mission.locationLat != null && mission.locationLng != null) {
      return `https://www.google.com/maps?q=${mission.locationLat},${mission.locationLng}`;
    }
    const query = mission.address
      ? `${mission.address.address}, ${mission.address.city}`
      : mission.addressText;
    if (!query) {
      return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  ngOnInit(): void {
    this.load();
    this.materialItemsService.findAll({ activeOnly: true, limit: 100 }).subscribe({
      next: (res) => this.catalog.set(res.data),
    });
  }

  private load(): void {
    this.state.set('loading');
    this.interventionsService.findOne(this.missionId()).subscribe({
      next: (mission) => {
        this.mission.set(mission);
        this.observationsForm.patchValue({
          observations: mission.observations ?? '',
        });
        this.state.set('loaded');
        this.loadEquipment(mission.clientId);
      },
      error: () => this.state.set('error'),
    });
  }

  private loadEquipment(clientId: string): void {
    this.equipmentService.findByClient(clientId).subscribe({
      next: (list) => this.clientEquipment.set(list),
    });
  }

  toggleEquipmentForm(): void {
    this.showEquipmentForm.update((v) => !v);
  }

  addEquipment(): void {
    const mission = this.mission();
    if (this.equipmentForm.invalid || !mission) {
      this.equipmentForm.markAllAsTouched();
      return;
    }
    const raw = this.equipmentForm.getRawValue();
    this.addingEquipment.set(true);
    this.equipmentService
      .create({
        name: raw.name!,
        category: raw.category || undefined,
        brand: raw.brand || undefined,
        serialNumber: raw.serialNumber || undefined,
        warrantyUntil: raw.warrantyUntil
          ? new Date(raw.warrantyUntil).toISOString()
          : undefined,
        clientId: mission.clientId,
        addressId: mission.addressId,
        interventionId: mission.id,
      })
      .subscribe({
        next: (equipment) => {
          this.clientEquipment.update((list) => [equipment, ...list]);
          this.equipmentForm.reset();
          this.showEquipmentForm.set(false);
          this.addingEquipment.set(false);
        },
        error: () => this.addingEquipment.set(false),
      });
  }

  accept(): void {
    this.accepting.set(true);
    this.errorMessage.set(null);
    this.interventionsService.accept(this.missionId()).subscribe({
      next: (mission) => {
        this.mission.set(mission);
        this.accepting.set(false);
      },
      error: () => {
        this.accepting.set(false);
        this.errorMessage.set('Impossible d\'accepter la mission.');
      },
    });
  }

  markOnTheWay(): void {
    this.settingOnTheWay.set(true);
    this.errorMessage.set(null);
    this.interventionsService.markOnTheWay(this.missionId()).subscribe({
      next: (mission) => {
        this.mission.set(mission);
        this.settingOnTheWay.set(false);
      },
      error: () => {
        this.settingOnTheWay.set(false);
        this.errorMessage.set("Impossible de signaler le déplacement.");
      },
    });
  }

  start(): void {
    this.starting.set(true);
    this.errorMessage.set(null);
    this.interventionsService.start(this.missionId()).subscribe({
      next: (mission) => {
        this.mission.set(mission);
        this.starting.set(false);
      },
      error: () => {
        this.starting.set(false);
        this.errorMessage.set("Impossible de démarrer la mission.");
      },
    });
  }

  saveObservations(): void {
    const observations = this.observationsForm.getRawValue().observations ?? '';
    this.savingObservations.set(true);
    this.errorMessage.set(null);
    this.interventionsService
      .updateObservations(this.missionId(), observations)
      .subscribe({
        next: (mission) => {
          this.mission.set(mission);
          this.savingObservations.set(false);
        },
        error: () => {
          this.savingObservations.set(false);
          this.errorMessage.set("Impossible d'enregistrer les observations.");
        },
      });
  }

  addMaterial(): void {
    const { materialItemId, name, quantity } = this.materialForm.getRawValue();

    if (this.materialForm.invalid || (!materialItemId && !name)) {
      this.materialForm.markAllAsTouched();
      this.errorMessage.set(
        'Choisissez un article du catalogue ou saisissez un nom.',
      );
      return;
    }

    this.addingMaterial.set(true);
    this.errorMessage.set(null);
    this.interventionsService
      .addMaterial(this.missionId(), {
        materialItemId: materialItemId || undefined,
        name: materialItemId ? undefined : name || undefined,
        quantity: quantity ?? 1,
      })
      .subscribe({
        next: (mission) => {
          this.mission.set(mission);
          this.materialForm.reset({ materialItemId: '', name: '', quantity: 1 });
          this.addingMaterial.set(false);
        },
        error: (err) => {
          this.addingMaterial.set(false);
          this.errorMessage.set(
            err?.error?.message || "Impossible d'ajouter le matériel.",
          );
        },
      });
  }

  removeMaterial(materialId: string): void {
    this.interventionsService
      .removeMaterial(this.missionId(), materialId)
      .subscribe({
        next: (mission) => this.mission.set(mission),
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploadingPhoto.set(true);
    this.errorMessage.set(null);
    this.interventionsService.addPhoto(this.missionId(), file).subscribe({
      next: (mission) => {
        this.mission.set(mission);
        this.uploadingPhoto.set(false);
        input.value = '';
      },
      error: () => {
        this.uploadingPhoto.set(false);
        this.errorMessage.set("Impossible d'envoyer la photo.");
        input.value = '';
      },
    });
  }

  removePhoto(photoId: string): void {
    this.interventionsService.removePhoto(this.missionId(), photoId).subscribe({
      next: (mission) => this.mission.set(mission),
    });
  }

  onSignatureChange(dataUrl: string | null): void {
    this.clientSignature.set(dataUrl);
  }

  complete(): void {
    if (this.completeForm.invalid) {
      this.completeForm.markAllAsTouched();
      return;
    }
    if (!this.clientSignature()) {
      this.errorMessage.set('Faites signer le client avant de clôturer la mission.');
      return;
    }
    const { report, actualDuration } = this.completeForm.getRawValue();
    this.completing.set(true);
    this.errorMessage.set(null);
    this.interventionsService
      .complete(
        this.missionId(),
        report!,
        actualDuration ?? undefined,
        this.clientSignature() ?? undefined,
      )
      .subscribe({
        next: (mission) => {
          this.mission.set(mission);
          this.completing.set(false);
        },
        error: () => {
          this.completing.set(false);
          this.errorMessage.set('Impossible de clôturer la mission.');
        },
      });
  }

  downloadReport(): void {
    this.downloadingReport.set(true);
    this.interventionsService.downloadReportPdf(this.missionId()).subscribe({
      next: ({ filename, content }) => {
        downloadBase64File(filename, content);
        this.downloadingReport.set(false);
      },
      error: () => this.downloadingReport.set(false),
    });
  }
}
