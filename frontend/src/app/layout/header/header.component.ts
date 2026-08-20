import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationsBellComponent } from '../notifications/notifications-bell.component';
import { SearchOverlayComponent } from '../search/search-overlay.component';
import { IconComponent, IconName } from '../../shared/icon/icon.component';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle.component';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    NotificationsBellComponent,
    SearchOverlayComponent,
    IconComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);

  readonly navItems: NavItem[] = [
    { label: 'Accueil', path: '/', icon: 'home' },
    { label: 'Réalisations', path: '/realisations', icon: 'image' },
    { label: 'Offres', path: '/offres', icon: 'tag' },
    { label: 'Boutique', path: '/boutique', icon: 'package' },
    { label: 'Espace Client', path: '/espace-client', icon: 'user' },
    { label: 'Contact', path: '/contact', icon: 'mail' },
  ];

  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);
  readonly cart = this.cartService.cart;

  isAuthenticated(): boolean {
    return !!this.authService.getAccessToken();
  }

  ngOnInit(): void {
    if (this.authService.getAccessToken()) {
      this.cartService.refresh().subscribe({ error: () => {} });
    }
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 10);
  }
}
