import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { SeoService } from './core/services/seo.service';

// Descend jusqu'à la route activée la plus profonde : sur une route avec
// enfants (ex. /admin/produits), c'est celle-là qui porte les `data`
// pertinentes, pas la route parente.
function deepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepestChild(route.firstChild) : route;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  // L'admin et le technicien ont chacun leur propre shell (sidebar) : on
  // masque le header/footer du site public sur ces routes.
  protected readonly isAppShellRoute = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(
        (e) =>
          e.urlAfterRedirects.startsWith('/admin') ||
          e.urlAfterRedirects.startsWith('/technicien'),
      ),
      startWith(
        this.router.url.startsWith('/admin') ||
          this.router.url.startsWith('/technicien'),
      ),
    ),
    { initialValue: false },
  );

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const description = deepestChild(this.router.routerState.snapshot.root)
          .data['description'] as string | undefined;
        if (description) {
          this.seoService.setDescription(description);
        }
      });
  }
}
