import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { DashboardService, DashboardResponse } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard = signal<DashboardResponse | null>(null);
  notification = signal<string | null>(null);
  avatarUploadMessage = signal<string | null>(null);
  productUploadMessage = signal<string | null>(null);
  avatarPreviewUrl = signal<string | null>(null);
  productUploadUrl = signal<string | null>(null);
  userId = signal('');
  productId = signal('');
  private avatarFile: File | null = null;
  private productFile: File | null = null;
  private socket: any;

  constructor(private readonly dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.getDashboard().subscribe((data) => {
      this.dashboard.set(data);
    });

    const userId = localStorage.getItem('userId');
    if (userId) {
      this.dashboardService.connectNotifications(userId).then((socket) => {
        this.socket = socket;
        if (socket) {
          socket.on('notification:new', (payload: any) => {
            this.notification.set(`${payload.title}: ${payload.message}`);
          });
        }
      });
    }
  }

  ngOnDestroy() {
    this.socket?.disconnect?.();
  }

  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.avatarFile = file;
    this.avatarUploadMessage.set(null);
  }

  onProductFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.productFile = file;
    this.productUploadMessage.set(null);
  }

  uploadAvatar() {
    if (!this.userId() || !this.avatarFile) {
      this.avatarUploadMessage.set('Veuillez renseigner un utilisateur et sélectionner une image.');
      return;
    }

    this.dashboardService.uploadAvatar(this.userId(), this.avatarFile).subscribe({
      next: (response) => {
        this.avatarUploadMessage.set('Avatar uploadé avec succès.');
        this.avatarPreviewUrl.set(response.url);
      },
      error: (error) => {
        this.avatarUploadMessage.set(error?.message || 'Échec de l upload de l avatar.');
      },
    });
  }

  uploadProductImage() {
    if (!this.productId() || !this.productFile) {
      this.productUploadMessage.set('Veuillez renseigner un produit et sélectionner une image.');
      return;
    }

    this.dashboardService.uploadProductImage(this.productId(), this.productFile).subscribe({
      next: (response) => {
        this.productUploadMessage.set('Image produit uploadée avec succès.');
        this.productUploadUrl.set(response.url);
      },
      error: (error) => {
        this.productUploadMessage.set(error?.message || 'Échec de l upload de l image produit.');
      },
    });
  }
}
