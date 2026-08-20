import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { NotificationsBellComponent } from '../../layout/notifications/notifications-bell.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-technicien-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NotificationsBellComponent,
    IconComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './technicien-layout.component.html',
})
export class TechnicienLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
    this.notificationsService.disconnect();
    this.router.navigate(['/espace-client/connexion']);
  }
}
