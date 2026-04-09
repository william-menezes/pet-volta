import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Rotas estáticas — prerender em build time
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'auth/login', renderMode: RenderMode.Prerender },
  { path: 'auth/register', renderMode: RenderMode.Prerender },
  { path: 'auth/forgot', renderMode: RenderMode.Prerender },
  { path: 'auth/reset', renderMode: RenderMode.Prerender },
  { path: 'auth/callback', renderMode: RenderMode.Prerender },
  { path: 'legal/terms', renderMode: RenderMode.Prerender },
  { path: 'legal/privacy', renderMode: RenderMode.Prerender },
  { path: 'legal/lgpd', renderMode: RenderMode.Prerender },

  // Área autenticada — CSR puro (sem SSR, evita hydration mismatch)
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'dashboard/pets', renderMode: RenderMode.Client },
  { path: 'dashboard/pets/new', renderMode: RenderMode.Client },
  { path: 'dashboard/pets/:id', renderMode: RenderMode.Client },
  { path: 'dashboard/pets/:id/edit', renderMode: RenderMode.Client },
  { path: 'dashboard/settings', renderMode: RenderMode.Client },
  { path: 'dashboard/pricing', renderMode: RenderMode.Client },
  { path: 'dashboard/reminders', renderMode: RenderMode.Client },
  { path: 'dashboard/nutrition', renderMode: RenderMode.Client },
  { path: 'dashboard/vets', renderMode: RenderMode.Client },
  { path: 'pets', renderMode: RenderMode.Client },
  { path: 'pets/new', renderMode: RenderMode.Client },
  { path: 'pets/:id', renderMode: RenderMode.Client },
  { path: 'pets/:id/edit', renderMode: RenderMode.Client },
  { path: 'settings', renderMode: RenderMode.Client },

  // Páginas públicas de pet — SSR para SEO e LCP < 1.5s
  { path: 't/:tagCode', renderMode: RenderMode.Server },
  { path: 'p/:slug', renderMode: RenderMode.Server },

  // Fallback
  { path: '**', renderMode: RenderMode.Server },
];
