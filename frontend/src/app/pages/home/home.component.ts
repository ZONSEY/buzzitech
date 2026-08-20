import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../../shared/icon/icon.component';

interface ServiceCard {
  code: string;
  icon: IconName;
  title: string;
  description: string;
  accentVar: string;
}

interface StatItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  readonly services: ServiceCard[] = [
    {
      code: 'SEC · 01',
      icon: 'camera',
      title: 'Sécurité électronique',
      description: "Vidéosurveillance, contrôle d'accès, alarmes anti-intrusion et géolocalisation de flotte.",
      accentVar: 'var(--color-buzz-red)',
    },
    {
      code: 'FIRE · 02',
      icon: 'flame',
      title: 'Protection incendie',
      description: "Détection précoce, systèmes d'extinction et mise en conformité réglementaire.",
      accentVar: 'var(--color-buzz-red)',
    },
    {
      code: 'NET · 03',
      icon: 'globe',
      title: 'Réseaux & cybersécurité',
      description: 'Infrastructure réseau, VPN, sauvegarde et supervision continue de vos systèmes.',
      accentVar: 'var(--color-buzz-cyan)',
    },
    {
      code: 'CONS · 04',
      icon: 'shield',
      title: 'Conseil & sécurité physique',
      description: 'Audit de vulnérabilité, ingénierie sur mesure, formation des équipes et dispositifs de terrain.',
      accentVar: 'var(--color-buzz-red)',
    },
  ];

  readonly stats: StatItem[] = [
    { value: '10+', label: "ANS D'EXPÉRIENCE" },
    { value: '500+', label: 'CLIENTS PROTÉGÉS' },
    { value: '120+', label: 'PROJETS LIVRÉS' },
    { value: '24/7', label: 'SUPERVISION' },
  ];

  readonly opsReadout = [
    { label: 'Nœuds actifs', value: '48' },
    { label: 'Latence moy.', value: '12 ms' },
    { label: 'Disponibilité', value: '99.98%', positive: true },
  ];
}
