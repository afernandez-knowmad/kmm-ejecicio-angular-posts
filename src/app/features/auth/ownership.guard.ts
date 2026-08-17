import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';

import { isOwner } from '@core/lib/ids';
import { AuthStore } from './auth.store';

/**
 * Forma del recurso que espera el ownership resolver. Cualquier cosa
 * con `userId` sirve. Tipo estructural para que `Post`, `Comment` o
 * cualquier recurso futuro lo cumplan sin herencia.
 */
export interface OwnedResource {
  readonly userId: string;
}

/**
 * Firma del resolver: dado el :id de la URL, trae el recurso y
 * devuelve su userId. Debe tirar o devolver `null` si no se puede
 * cargar.
 */
export type OwnershipResolver = (id: string) => Promise<OwnedResource | null>;

/**
 * Construye un `CanMatchFn` que comprueba si el usuario autenticado
 * es dueño del recurso referenciado por el `:id` de la ruta.
 *
 * En caso contrario redirige a la vista de solo lectura
 * (`/<base>/:id`) para que el usuario pueda seguir leyendo; la UI
 * del feedback la lleva el `?forbidden=1` en la página.
 */
export function ownershipGuardFor(basePath: string, resolver: OwnershipResolver): CanMatchFn {
  return async (
    route: Route,
    segments: UrlSegment[],
    snapshot: Parameters<CanMatchFn>[2],
  ): Promise<boolean | UrlTree> => {
    void snapshot;
    void route;
    const store = inject(AuthStore);
    const router = inject(Router);

    if (!store.isAuthenticated()) {
      // authGuard cubre este caso en la práctica; por si corre solo.
      return router.createUrlTree(['/login']);
    }

    const id = segments.find((s) => s.path !== basePath)?.path ?? '';
    if (!id) {
      return router.createUrlTree([basePath]);
    }

    const resource = await resolver(id);
    if (!resource) {
      return router.createUrlTree([basePath, id]);
    }

    const currentUserId = store.user()?.id;
    if (isOwner(resource.userId, currentUserId)) {
      return true;
    }

    return router.createUrlTree([basePath, id], {
      queryParams: { forbidden: 1 },
    });
  };
}
