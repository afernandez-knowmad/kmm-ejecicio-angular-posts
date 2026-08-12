import { Routes } from '@angular/router';

import { authGuard } from './features/auth/auth.guard';

/**
 * Top-level routes for the app.
 *
 * Authenticated routes use `authGuard` via `canMatch` so the lazy
 * chunk is not even loaded when the user is not signed in. The login
 * route is intentionally NOT guarded so anonymous users can reach it.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
    title: 'auth.login.title',
  },
  {
    path: 'posts',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./features/posts/pages/posts-list.page').then((m) => m.PostsListPage),
    title: 'posts.list.title',
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
