import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardResponse {
  overview: {
    totalUsers: number;
    totalOrders: number;
    totalProducts: number;
    totalServices: number;
    totalProjects: number;
    unreadMessages: number;
    pendingOrders: number;
    revenue: number;
  };
  sales: Array<{ date: string; amount: number }>;
  orders: Record<string, number>;
  inventory: { lowStock: number; outOfStock: number; inventoryValue: number };
  users: { total: number; admins: number; techniciens: number; clients: number };
  kpis: {
    averageOrderValue: number;
    ordersToday: number;
    newUsersToday: number;
    averageProjectsBudget: number;
  };
  trends: {
    revenue: { current: number; previous: number; growth: number };
    orders: { current: number; previous: number; growth: number };
  };
  alerts: {
    outOfStock: number;
    lowStock: number;
    unreadMessages: number;
    pendingOrders: number;
    newProjects: number;
    failedPayments: number;
  };
  latestOrders: Array<{ id: string; reference?: string; createdAt: string; user?: { nom?: string; prenom?: string } }>;
  recentActivities: Array<{ id: string; action: string; createdAt: string; user?: { nom?: string; prenom?: string } }>;
  topProducts: Array<{ product: { name?: string } | null; totalSold: number }>;
  topServices: Array<{ service: { name?: string } | null; totalSold: number }>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private readonly http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>('/api/dashboard');
  }

  uploadAvatar(userId: string, file: File): Observable<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const token = localStorage.getItem('authToken');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.post<{ success: boolean; url: string }>(`/api/users/${userId}/avatar`, formData, {
      headers,
    });
  }

  uploadProductImage(productId: string, file: File): Observable<{ id: string; productId: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('authToken');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.post<{ id: string; productId: string; url: string }>(`/api/product-images/${productId}`, formData, {
      headers,
    });
  }

  async connectNotifications(userId: string): Promise<any> {
    if (!userId) {
      return null;
    }

    const { io } = await import('socket.io-client');
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('authToken') ?? undefined,
      },
    });

    socket.emit('join', { userId });

    return socket;
  }
}
