import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <span class="mb-4 h-px w-10 bg-buzz-red"></span>
      <h1 class="font-heading text-3xl font-bold text-white sm:text-4xl">{{ title }}</h1>
      <p class="mt-4 max-w-md text-sm leading-relaxed text-buzz-muted">
        Cette section est en cours de construction. Revenez bientôt.
      </p>
    </section>
  `,
})
export class ComingSoonComponent {
  @Input() title = 'Page en construction';

  constructor(private route: ActivatedRoute) {
    const data = this.route.snapshot.data;
    if (data['title']) {
      this.title = data['title'];
    }
  }
}
