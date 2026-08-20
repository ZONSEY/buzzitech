import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AppNotification } from '../../core/models/notification.model';
import { NotificationsService } from '../../core/services/notifications.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './notifications-bell.component.html',
  styleUrl: './notifications-bell.component.css',
})
export class NotificationsBellComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);

  readonly isOpen = signal(false);
  readonly unreadCount = this.notificationsService.unreadCount;
  readonly items = signal<AppNotification[]>([]);
  readonly loaded = signal(false);

  ngOnInit(): void {
    this.notificationsService.connect();
  }

  toggle(): void {
    this.isOpen.update((open) => !open);
    if (this.isOpen() && !this.loaded()) {
      this.notificationsService.findMine(1).subscribe({
        next: (res) => {
          this.items.set(res.data);
          this.loaded.set(true);
        },
      });
    }
  }

  close(): void {
    this.isOpen.set(false);
  }

  markRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }
    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.isRead = true;
        this.notificationsService.unreadCount.update((c) => Math.max(0, c - 1));
      },
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        this.items.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.notificationsService.unreadCount.set(0);
      },
    });
  }
}
