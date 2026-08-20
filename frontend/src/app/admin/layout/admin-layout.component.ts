import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { IconComponent, IconName } from '../../shared/icon/icon.component';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

interface AdminNavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IconComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationsService = inject(NotificationsService);
  private readonly router = inject(Router);

  readonly navItems: AdminNavItem[] = [
    { label: 'Tableau de bord', path: '/admin', icon: 'grid' },
    { label: 'Commandes', path: '/admin/commandes', icon: 'shopping-cart' },
    { label: 'Demandes de projet', path: '/admin/projets', icon: 'clipboard-list' },
    { label: 'Utilisateurs', path: '/admin/utilisateurs', icon: 'user' },
    { label: 'Interventions', path: '/admin/interventions', icon: 'wrench' },
    { label: 'Catalogue matériel', path: '/admin/materiel', icon: 'package' },
    { label: 'Codes promo', path: '/admin/codes-promo', icon: 'tag' },
    { label: 'Équipements', path: '/admin/equipements', icon: 'package' },
    { label: 'Contrats maintenance', path: '/admin/contrats-maintenance', icon: 'calendar' },
    { label: 'Messages de contact', path: '/admin/messages', icon: 'mail' },
    { label: 'Réalisations', path: '/admin/realisations', icon: 'image' },
    { label: 'Produits', path: '/admin/produits', icon: 'package' },
    { label: 'Catégories & marques', path: '/admin/categories', icon: 'folder' },
    { label: 'Offres', path: '/admin/offres', icon: 'tag' },
  ];

  logout(): void {
    this.authService.logout();
    this.notificationsService.disconnect();
    this.router.navigate(['/espace-client/connexion']);
  }
}
