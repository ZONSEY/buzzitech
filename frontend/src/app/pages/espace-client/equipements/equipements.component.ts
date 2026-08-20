import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Equipment } from '../../../core/models/equipment.model';
import { EquipmentService } from '../../../core/services/equipment.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-equipements',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './equipements.component.html',
})
export class EquipementsComponent {
  private readonly service = inject(EquipmentService);

  readonly state = signal<LoadState>('loading');
  readonly equipment = signal<Equipment[]>([]);

  constructor() {
    this.service.findMine().subscribe({
      next: (list) => {
        this.equipment.set(list);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }

  isUnderWarranty(eq: Equipment): boolean {
    return !!eq.warrantyUntil && new Date(eq.warrantyUntil) > new Date();
  }
}
