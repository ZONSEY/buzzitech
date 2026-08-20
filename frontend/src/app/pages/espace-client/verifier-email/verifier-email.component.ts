import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type VerifyState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-verifier-email',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './verifier-email.component.html',
  styleUrl: './verifier-email.component.css',
})
export class VerifierEmailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  readonly state = signal<VerifyState>('loading');

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }
}
