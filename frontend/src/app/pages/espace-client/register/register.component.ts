import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';

// Miroir de la validation backend (IsStrongPassword) :
// min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 symbole
const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.pattern(/^[0-9]{8,15}$/)]],
    password: ['', [Validators.required, Validators.pattern(STRONG_PASSWORD_REGEX)]],
  });

  get f() {
    return this.form.controls;
  }

  toggleShowPassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const { nom, prenom, email, telephone, password } = this.form.getRawValue();

    this.authService
      .register({
        nom: nom!,
        prenom: prenom!,
        email: email!,
        telephone: telephone || undefined,
        password: password!,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/espace-client']);
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(
            err?.status === 409
              ? 'Cet email est déjà utilisé.'
              : "Une erreur est survenue. Réessayez.",
          );
        },
      });
  }
}
