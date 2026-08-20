import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ProjectRequest } from '../../../../core/models/project-request.model';
import { ProjectRequestsService } from '../../../../core/services/project-requests.service';
import { IconComponent } from '../../../../shared/icon/icon.component';
import { downloadBase64File } from '../../../../shared/utils/download-base64.util';

type LoadState = 'loading' | 'loaded' | 'error' | 'not-found';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  ANALYSIS: 'En analyse',
  APPROVED: 'Approuvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

@Component({
  selector: 'app-projet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
})
export class ProjetDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ProjectRequestsService);

  readonly state = signal<LoadState>('loading');
  readonly project = signal<ProjectRequest | null>(null);
  readonly downloadingPdf = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.state.set('loading');
          return this.service.findOne(params.get('id')!);
        }),
      )
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.state.set('loaded');
        },
        error: (err) => {
          this.state.set(err?.status === 404 ? 'not-found' : 'error');
        },
      });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  downloadPdf(): void {
    const project = this.project();
    if (!project) {
      return;
    }
    this.downloadingPdf.set(true);
    this.service.downloadQuotePdf(project.id).subscribe({
      next: ({ filename, content }) => {
        downloadBase64File(filename, content);
        this.downloadingPdf.set(false);
      },
      error: () => this.downloadingPdf.set(false),
    });
  }
}
