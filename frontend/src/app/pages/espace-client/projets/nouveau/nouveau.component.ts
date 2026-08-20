import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectRequestsService } from '../../../../core/services/project-requests.service';
import { IconComponent } from '../../../../shared/icon/icon.component';
import {
  LocationPickerComponent,
  PickedLocation,
} from '../../../../shared/location-picker/location-picker.component';

@Component({
  selector: 'app-nouveau-projet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    LocationPickerComponent,
  ],
  templateUrl: './nouveau.component.html',
  styleUrl: './nouveau.component.css',
})
export class NouveauProjetComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ProjectRequestsService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly location = signal<PickedLocation | null>(null);

  onLocationChange(location: PickedLocation | null): void {
    this.location.set(location);
  }

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    budget: [null as number | null],
    deadline: [''],
  });

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set(null);

    const location = this.location();

    this.service
      .create({
        title: raw.title!,
        description: raw.description!,
        budget: raw.budget ?? undefined,
        deadline: raw.deadline || undefined,
        locationLat: location?.lat,
        locationLng: location?.lng,
        locationAddress: location?.address ?? undefined,
      })
      .subscribe({
        next: (project) => {
          this.submitting.set(false);
          this.router.navigate(['/espace-client/projets', project.id]);
        },
        error: () => {
          this.submitting.set(false);
          this.errorMessage.set('Une erreur est survenue. Réessayez.');
        },
      });
  }
}
