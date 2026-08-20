import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
} from '../../../core/models/intervention.model';
import { InterventionsService } from '../../../core/services/interventions.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { downloadBase64File } from '../../../shared/utils/download-base64.util';

@Component({
  selector: 'app-intervention-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ReactiveFormsModule],
  templateUrl: './intervention-detail.component.html',
})
export class InterventionDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(InterventionsService);
  private readonly fb = inject(FormBuilder);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly intervention = signal<Intervention | null>(null);
  readonly downloadingReport = signal(false);
  readonly stars = [1, 2, 3, 4, 5];
  readonly hoveredStar = signal(0);
  readonly submittingRating = signal(false);

  readonly ratingForm = this.fb.group({
    rating: [0],
    comment: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.findOne(id).subscribe({
      next: (intervention) => {
        this.intervention.set(intervention);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  downloadReport(): void {
    const intervention = this.intervention();
    if (!intervention) {
      return;
    }
    this.downloadingReport.set(true);
    this.service.downloadReportPdf(intervention.id).subscribe({
      next: ({ filename, content }) => {
        downloadBase64File(filename, content);
        this.downloadingReport.set(false);
      },
      error: () => this.downloadingReport.set(false),
    });
  }

  setRating(value: number): void {
    this.ratingForm.patchValue({ rating: value });
  }

  submitRating(): void {
    const intervention = this.intervention();
    const { rating, comment } = this.ratingForm.getRawValue();
    if (!intervention || !rating) {
      return;
    }
    this.submittingRating.set(true);
    this.service.rate(intervention.id, rating, comment || undefined).subscribe({
      next: (updated) => {
        this.intervention.set(updated);
        this.submittingRating.set(false);
      },
      error: () => this.submittingRating.set(false),
    });
  }
}
