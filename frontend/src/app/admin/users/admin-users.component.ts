import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { User, UserRole } from '../../core/models/user.model';
import { PaginationMeta } from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { AdminUsersService } from './admin-users.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

const ROLES: UserRole[] = ['ADMIN', 'CLIENT', 'TECHNICIEN'];

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  CLIENT: 'Client',
  TECHNICIEN: 'Technicien',
};

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
})
export class AdminUsersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminUsersService);
  private readonly authService = inject(AuthService);

  readonly roles = ROLES;
  readonly roleLabels = ROLE_LABELS;
  readonly currentUserId = this.authService.currentUser()?.id ?? null;

  readonly state = signal<LoadState>('loading');
  readonly users = signal<User[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly updatingId = signal<string | null>(null);

  readonly filters = this.fb.group({
    search: [''],
    role: [''],
  });

  constructor() {
    this.load();

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  roleLabel(role: string): string {
    return this.roleLabels[role as UserRole] ?? role;
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  changeRole(user: User, role: string): void {
    if (!role || role === user.role) {
      return;
    }

    this.updatingId.set(user.id);
    this.service.updateRole(user.id, role as UserRole).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: updated.role } : u)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  remove(user: User): void {
    if (!confirm(`Supprimer le compte de « ${user.prenom} ${user.nom} » ?`)) {
      return;
    }

    this.updatingId.set(user.id);
    this.service.remove(user.id).subscribe({
      next: () => {
        this.updatingId.set(null);
        this.load();
      },
      error: () => this.updatingId.set(null),
    });
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();

    this.service
      .findAll({
        page: this.page(),
        search: raw.search || undefined,
        role: (raw.role || undefined) as UserRole | undefined,
      })
      .subscribe({
        next: (res) => {
          this.users.set(res.data);
          this.meta.set(res.meta);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }
}
