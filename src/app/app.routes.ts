import { CanMatchFn, Routes } from '@angular/router';

import { authGuard } from '@features/auth/auth.guard';
import { ownershipGuardFor } from '@features/auth/ownership.guard';
import { injectPostsOwnershipResolver } from '@features/posts/posts.resolver';

// Wrapper que retrasa la construcción del resolver hasta que la ruta
// se matchea, así `inject()` corre dentro de un InjectionContext.
const postOwnershipGuard: CanMatchFn = (route, segments, snapshot) =>
  ownershipGuardFor('posts', injectPostsOwnershipResolver())(route, segments, snapshot);

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.page').then((m) => m.LoginPage),
    title: 'auth.login.title',
  },
  {
    path: 'posts/new',
    canMatch: [authGuard],
    loadComponent: () => import('./features/posts/pages/post-new.page').then((m) => m.PostNewPage),
    title: 'posts.form.newTitle',
  },
  {
    path: 'posts/:id/edit',
    canMatch: [authGuard, postOwnershipGuard],
    loadComponent: () =>
      import('./features/posts/pages/post-edit.page').then((m) => m.PostEditPage),
    title: 'posts.form.editTitle',
  },
  {
    path: 'posts/:id',
    canMatch: [authGuard],
    loadComponent: () =>
      import('./features/posts/pages/post-detail.page').then((m) => m.PostDetailPage),
    title: 'posts.detail.title',
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
