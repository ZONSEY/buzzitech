import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';

function passwordsMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return password && confirm && password !== confirm
    ? { passwordsMismatch: true }
    : null;
}

@Component({
  selector: 'app-reinitialiser-mot-de-passe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './reinitialiser-mot-de-passe.component.html',
  styleUrl: './reinitialiser-mot-de-passe.component.css',
})
export class ReinitialiserMotDePasseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly token = this.route.snapshot.queryParamMap.get('token');

  readonly submitting = signal(false);
  readonly done = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  get f() {
    return this.form.controls;
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (!this.token) {
      this.errorMessage.set('Lien de réinitialisation invalide.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { password } = this.form.getRawValue();

    this.authService.resetPassword(this.token, password!).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigate(['/espace-client/connexion']), 2000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(
          err?.status === 400
            ? 'Ce lien est invalide ou a expiré.'
            : 'Une erreur est survenue. Réessayez.',
        );
      },
    });
  }
}
