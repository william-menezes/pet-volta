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
      import('./features/dashboard/dashboard.page').then(
        (m) => m.DashboardPage,
      ),
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
