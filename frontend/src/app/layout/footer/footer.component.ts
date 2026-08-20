import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';

interface FooterLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  readonly year = new Date().getFullYear();

  readonly services: FooterLink[] = [
    { label: 'Sécurité électronique', path: '/offres' },
    { label: 'Protection incendie', path: '/offres' },
    { label: 'Réseaux & cybersécurité', path: '/offres' },
    { label: 'Conseil & sécurité physique', path: '/offres' },
  ];

  readonly navigation: FooterLink[] = [
    { label: 'Accueil', path: '/' },
    { label: 'Réalisations', path: '/realisations' },
    { label: 'Offres', path: '/offres' },
    { label: 'Boutique', path: '/boutique' },
    { label: 'Contact', path: '/contact' },
  ];

  readonly legal: FooterLink[] = [
    { label: 'Mentions légales', path: '/mentions-legales' },
    { label: 'CGV', path: '/cgv' },
    { label: 'Politique de confidentialité', path: '/politique-de-confidentialite' },
  ];
}
