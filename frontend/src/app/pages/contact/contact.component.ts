import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ContactService } from './contact.service';
import { IconComponent } from '../../shared/icon/icon.component';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  readonly state = signal<SubmitState>('idle');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    subject: ['', [Validators.required, Validators.maxLength(150)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  get f() {
    return this.form.controls;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, subject, message } = this.form.getRawValue();

    this.state.set('submitting');

    this.contactService
      .send({
        name: name!,
        email: email!,
        phone: phone || undefined,
        subject: subject!,
        message: message!,
      })
      .subscribe({
        next: () => {
          this.state.set('success');
          this.form.reset();
        },
        error: () => {
          this.state.set('error');
        },
      });
  }
}
