import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterventionsService } from '../../core/services/interventions.service';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
  TechnicianStats,
} from '../../core/models/intervention.model';

type PeriodFilter = 'today' | 'week' | 'all';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return endOfDay(d);
}

@Component({
  selector: 'app-technicien-planning',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './technicien-planning.component.html',
})
export class TechnicienPlanningComponent implements OnInit {
  private readonly interventionsService = inject(InterventionsService);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly missions = signal<Intervention[]>([]);
  readonly period = signal<PeriodFilter>('today');
  readonly stats = signal<TechnicianStats | null>(null);

  ngOnInit(): void {
    this.load();
    this.interventionsService.findMyStats().subscribe({
      next: (stats) => this.stats.set(stats),
    });
  }

  setPeriod(period: PeriodFilter): void {
    if (this.period() === period) {
      return;
    }
    this.period.set(period);
    this.load();
  }

  private load(): void {
    this.state.set('loading');

    const now = new Date();
    let from: string | undefined;
    let to: string | undefined;

    if (this.period() === 'today') {
      from = startOfDay(now).toISOString();
      to = endOfDay(now).toISOString();
    } else if (this.period() === 'week') {
      from = startOfWeek(now).toISOString();
      to = endOfWeek(now).toISOString();
    }

    this.interventionsService.findMine({ from, to, limit: 100 }).subscribe({
      next: (res) => {
        this.missions.set(res.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  statusBadgeClass(status: Intervention['status']): string {
    switch (status) {
      case 'SCHEDULED':
      case 'ACCEPTED':
      case 'ON_THE_WAY':
        return 'text-buzz-cyan';
      case 'IN_PROGRESS':
        return 'text-buzz-red';
      case 'COMPLETED':
        return 'text-white';
      default:
        return 'text-buzz-muted';
    }
  }
}
