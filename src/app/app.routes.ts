import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login.page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register.page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot',
        loadComponent: () =>
          import('./features/auth/forgot-password.page').then(
            (m) => m.ForgotPasswordPage,
          ),
      },
      {
        path: 'reset',
        loadComponent: () =>
          import('./features/auth/reset-password.page').then(
            (m) => m.ResetPasswordPage,
          ),
      },
      {
        path: 'reset-password',
        pathMatch: 'full',
        redirectTo: 'reset',
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./features/auth/auth-callback.page').then(
            (m) => m.AuthCallbackPage,
          ),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.layout').then(
        (m) => m.DashboardLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'pets',
        loadComponent: () =>
          import('./features/pets/pet-list.page').then((m) => m.PetListPage),
      },
      {
        path: 'pets/new',
        loadComponent: () =>
          import('./features/pets/pet-form.page').then((m) => m.PetFormPage),
      },
      {
        path: 'pets/:id',
        loadComponent: () =>
          import('./features/pets/pet-detail.page').then((m) => m.PetDetailPage),
      },
      {
        path: 'pets/:id/edit',
        loadComponent: () =>
          import('./features/pets/pet-form.page').then((m) => m.PetFormPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/dashboard/pricing/pricing.page').then(
            (m) => m.PricingPage,
          ),
      },
      {
        path: 'reminders',
        loadComponent: () =>
          import('./features/reminders/reminders.page').then((m) => m.RemindersPage),
      },
      {
        path: 'nutrition',
        loadComponent: () =>
          import('./features/nutrition/nutrition.page').then((m) => m.NutritionPage),
      },
      {
        path: 'vets',
        loadComponent: () =>
          import('./features/vets/vets.page').then((m) => m.VetsPage),
      },
    ],
  },
  {
    path: 'pets',
    pathMatch: 'full',
    redirectTo: 'dashboard/pets',
  },
  {
    path: 'pets/new',
    pathMatch: 'full',
    redirectTo: 'dashboard/pets/new',
  },
  {
    path: 'pets/:id',
    pathMatch: 'full',
    redirectTo: 'dashboard/pets/:id',
  },
  {
    path: 'pets/:id/edit',
    pathMatch: 'full',
    redirectTo: 'dashboard/pets/:id/edit',
  },
  {
    path: 't/:tagCode',
    loadComponent: () =>
      import('./features/tags/tag-activate.page').then((m) => m.TagActivatePage),
  },
  {
    path: 'p/:slug',
    loadComponent: () =>
      import('./features/public-pet/public-pet.page').then(
        (m) => m.PublicPetPage,
      ),
  },
  {
    path: 'settings',
    pathMatch: 'full',
    redirectTo: 'dashboard/settings',
  },
  {
    path: 'legal',
    children: [
      {
        path: 'terms',
        loadComponent: () =>
          import('./features/legal/terms.page').then((m) => m.TermsPage),
      },
      {
        path: 'privacy',
        loadComponent: () =>
          import('./features/legal/privacy.page').then((m) => m.PrivacyPage),
      },
      {
        path: 'lgpd',
        loadComponent: () =>
          import('./features/legal/lgpd.page').then((m) => m.LgpdPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
