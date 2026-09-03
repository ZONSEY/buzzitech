export {};

// window.__env est injecté par env.js (voir public/env.js.template et
// docker-entrypoint.d/30-env-config.sh) — apiBaseUrl y est vide en local
// (proxy nginx same-origin) et vaut l'origine de l'API en déploiement
// séparé frontend/backend. Déclaré ici (fichier .d.ts global, repris par
// tsconfig.app.json ET tsconfig.spec.json) plutôt que dans un des fichiers
// qui l'utilise : un `declare global` local ne fusionne que si ce fichier
// fait partie du graphe compilé, ce qui n'est pas garanti pour `ng test`.
declare global {
  interface Window {
    __env?: { apiBaseUrl?: string };
  }
}
