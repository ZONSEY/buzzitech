import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Accueil : contenu marketing statique, pré-rendu au build.
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    // Toutes les autres pages dépendent de données live (produits,
    // offres, réalisations, compte...) : rendu client uniquement,
    // sinon elles seraient figées avec les données du moment du build.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
