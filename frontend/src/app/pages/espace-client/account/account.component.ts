import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationsService } from '../../../core/services/notifications.service';
import { User } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
})
export class AccountComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const cached = this.authService.currentUser();
    if (cached) {
      this.user.set(cached);
      this.loading.set(false);
      return;
    }

    this.authService.me().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: () => this.router.navigate(['/espace-client/connexion']),
    });
  }

  logout(): void {
    this.authService.logout();
    this.notificationsService.disconnect();
    this.router.navigate(['/espace-client/connexion']);
  }
}
