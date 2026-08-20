import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './mot-de-passe-oublie.component.html',
  styleUrl: './mot-de-passe-oublie.component.css',
})
export class MotDePasseOublieComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { email } = this.form.getRawValue();

    this.authService.forgotPassword(email!).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('Une erreur est survenue. Réessayez.');
      },
    });
  }
}
