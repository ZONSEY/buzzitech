import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  AdminMessagesService,
  ContactMessageAdmin,
} from './admin-messages.service';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './admin-messages.component.html',
  styleUrl: './admin-messages.component.css',
})
export class AdminMessagesComponent {
  private readonly service = inject(AdminMessagesService);

  readonly state = signal<LoadState>('loading');
  readonly messages = signal<ContactMessageAdmin[]>([]);
  readonly openId = signal<string | null>(null);
  readonly replyText = signal('');
  readonly sending = signal(false);

  constructor() {
    this.load();
  }

  toggleOpen(message: ContactMessageAdmin): void {
    this.openId.set(this.openId() === message.id ? null : message.id);
    this.replyText.set('');
  }

  sendReply(message: ContactMessageAdmin): void {
    const text = this.replyText().trim();
    if (!text) {
      return;
    }

    this.sending.set(true);
    this.service.reply(message.id, text).subscribe({
      next: (updated) => {
        this.messages.update((list) =>
          list.map((m) => (m.id === updated.id ? updated : m)),
        );
        this.sending.set(false);
        this.openId.set(null);
        this.replyText.set('');
      },
      error: () => this.sending.set(false),
    });
  }

  private load(): void {
    this.state.set('loading');
    this.service.findAll().subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
