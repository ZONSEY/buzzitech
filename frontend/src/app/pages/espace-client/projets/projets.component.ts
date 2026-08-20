import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProjectRequest } from '../../../core/models/project-request.model';
import { ProjectRequestsService } from '../../../core/services/project-requests.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nouvelle',
  ANALYSIS: 'En analyse',
  APPROVED: 'Approuvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

@Component({
  selector: 'app-projets',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './projets.component.html',
  styleUrl: './projets.component.css',
})
export class ProjetsComponent {
  private readonly service = inject(ProjectRequestsService);

  readonly state = signal<LoadState>('loading');
  readonly projects = signal<ProjectRequest[]>([]);

  constructor() {
    this.load();
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  private load(): void {
    this.state.set('loading');
    this.service.findMine().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
