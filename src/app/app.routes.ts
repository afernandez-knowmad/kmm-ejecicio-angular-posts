import { Routes } from '@angular/router';

/**
 * Top-level routes for the app.
 *
 * Authenticated routes will be added in their own commits and use
 * `authGuard` via `canMatch`. The login route is intentionally NOT
 * guarded so anonymous users can reach it.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
    title: 'auth.login.title',
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/posts',
  },
  {
    path: '**',
    redirectTo: '/posts',
  },
];
