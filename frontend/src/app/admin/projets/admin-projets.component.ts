import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PROJECT_QUOTE_VAT_RATE,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TRANSITIONS,
  ProjectRequest,
  ProjectStatus,
  QuoteLineItem,
} from '../../core/models/project-request.model';
import { AdminProjetsService } from './admin-projets.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { downloadBase64File } from '../../shared/utils/download-base64.util';
import { LocationPickerComponent } from '../../shared/location-picker/location-picker.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-projets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    LocationPickerComponent,
  ],
  templateUrl: './admin-projets.component.html',
})
export class AdminProjetsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminProjetsService);

  readonly state = signal<LoadState>('loading');
  readonly projects = signal<ProjectRequest[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly itemBusyId = signal<string | null>(null);
  readonly downloadingId = signal<string | null>(null);
  readonly errorFor = signal<string | null>(null);

  readonly statusLabels = PROJECT_STATUS_LABELS;
  readonly vatRate = PROJECT_QUOTE_VAT_RATE;

  readonly estimateForm = this.fb.group({
    estimatedDuration: [null as number | null],
    adminComment: [''],
  });

  readonly lineItemForm = this.fb.group({
    designation: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  constructor() {
    this.load();
  }

  statusLabel(status: string): string {
    return this.statusLabels[status as ProjectStatus] ?? status;
  }

  nextStatuses(status: ProjectStatus): ProjectStatus[] {
    return PROJECT_STATUS_TRANSITIONS[status] ?? [];
  }

  toggleExpand(project: ProjectRequest): void {
    if (this.expandedId() === project.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(project.id);
    this.errorFor.set(null);
    this.estimateForm.reset({
      estimatedDuration: project.estimatedDuration,
      adminComment: project.adminComment ?? '',
    });
    this.lineItemForm.reset({ quantity: 1 });
  }

  totalHT(project: ProjectRequest): number {
    return project.quoteItems.reduce(
      (sum, item) => sum + +item.unitPrice * item.quantity,
      0,
    );
  }

  totalTVA(project: ProjectRequest): number {
    return this.totalHT(project) * this.vatRate;
  }

  totalTTC(project: ProjectRequest): number {
    return this.totalHT(project) + this.totalTVA(project);
  }

  changeStatus(project: ProjectRequest, status: ProjectStatus): void {
    this.savingId.set(project.id);
    this.errorFor.set(null);
    this.service.updateStatus(project.id, status).subscribe({
      next: (updated) => {
        this.savingId.set(null);
        this.replaceProject(updated);
      },
      error: () => {
        this.savingId.set(null);
        this.errorFor.set(project.id);
      },
    });
  }

  saveEstimate(project: ProjectRequest): void {
    const raw = this.estimateForm.getRawValue();
    this.savingId.set(project.id);
    this.errorFor.set(null);
    this.service
      .estimate(project.id, {
        estimatedDuration: raw.estimatedDuration ?? undefined,
        adminComment: raw.adminComment || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.savingId.set(null);
          this.replaceProject(updated);
        },
        error: () => {
          this.savingId.set(null);
          this.errorFor.set(project.id);
        },
      });
  }

  addLineItem(project: ProjectRequest): void {
    if (this.lineItemForm.invalid) {
      this.lineItemForm.markAllAsTouched();
      return;
    }
    const raw = this.lineItemForm.getRawValue();
    this.itemBusyId.set(project.id);
    this.errorFor.set(null);
    this.service
      .addQuoteItem(project.id, {
        designation: raw.designation!,
        quantity: raw.quantity ?? 1,
        unitPrice: raw.unitPrice!,
      })
      .subscribe({
        next: (updated) => {
          this.itemBusyId.set(null);
          this.lineItemForm.reset({ quantity: 1 });
          this.replaceProject(updated);
        },
        error: () => {
          this.itemBusyId.set(null);
          this.errorFor.set(project.id);
        },
      });
  }

  removeLineItem(project: ProjectRequest, item: QuoteLineItem): void {
    this.itemBusyId.set(project.id);
    this.errorFor.set(null);
    this.service.removeQuoteItem(item.id).subscribe({
      next: (updated) => {
        this.itemBusyId.set(null);
        this.replaceProject(updated);
      },
      error: () => {
        this.itemBusyId.set(null);
        this.errorFor.set(project.id);
      },
    });
  }

  downloadQuote(project: ProjectRequest): void {
    this.downloadingId.set(project.id);
    this.service.downloadQuotePdf(project.id).subscribe({
      next: (res) => {
        this.downloadingId.set(null);
        downloadBase64File(res.filename, res.content);
      },
      error: () => this.downloadingId.set(null),
    });
  }

  private replaceProject(updated: ProjectRequest): void {
    this.projects.update((list) =>
      list.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
