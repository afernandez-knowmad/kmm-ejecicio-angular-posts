import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CommentsSectionComponent } from './comments-section.component';
import { UsersStore } from '@features/posts/users.store';
import { provideTestApp } from '@core/testing/test-providers';
import type { ServerPage } from '@features/posts/models/post-filters.model';
import type { Comment } from '../models/comment.model';

const POST_ID = '42';

function makeComment(over: Partial<Comment> = {}): Comment {
  return {
    id: 'c1',
    postId: POST_ID,
    userId: '1',
    body: 'first comment',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

/**
 * Construye una respuesta con forma `ServerPage` que matchea lo que
 * devuelve json-server v1-beta para comentarios paginados.
 */
function makePage(comments: readonly Comment[], hasMore = false): ServerPage<Comment> {
  return {
    first: 1,
    prev: null,
    next: hasMore ? 2 : null,
    last: hasMore ? 2 : 1,
    pages: hasMore ? 2 : 1,
    items: comments.length,
    data: comments,
  };
}

/**
 * Stub de UsersStore para que su fetch en background (que usan
 * otros componentes aguas abajo) no deje requests colgadas. Esta
 * sección no depende de él.
 */
class StubUsersStore {
  readonly users = () => [] as readonly never[];
  readonly byId = () => new Map<string, never>();
  ensureLoaded = () => Promise.resolve();
}

describe('CommentsSectionComponent', () => {
  it('renders loading and ready states as the httpResource resolves', async () => {
    const view = await render(CommentsSectionComponent, {
      providers: provideTestApp([
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersStore, useClass: StubUsersStore },
      ]),
      inputs: { postId: POST_ID },
    });

    const httpTesting = TestBed.inject(HttpTestingController);

    // Estado inicial: depende de la caché (vacía) y del status del
    // recurso, así que deberíamos ver el estado de loading.
    expect(view.getByTestId('comments-loading')).toBeTruthy();

    // Hacemos flush del GET disparado por el httpResource con la
    // forma paginada que devuelve json-server.
    const req = httpTesting.expectOne((r: { url: string }) => r.url.includes('/comments'));
    req.flush(makePage([makeComment()]));

    await view.fixture.whenStable();

    expect(view.queryByTestId('comments-loading')).toBeNull();
    expect(view.queryByTestId('comments-items')).toBeTruthy();
    expect(view.getByText('first comment')).toBeTruthy();

    httpTesting.verify();
  });

  it('renders the empty state when the backend returns no comments', async () => {
    const view = await render(CommentsSectionComponent, {
      providers: provideTestApp([
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UsersStore, useClass: StubUsersStore },
      ]),
      inputs: { postId: POST_ID },
    });

    const httpTesting = TestBed.inject(HttpTestingController);
    const req = httpTesting.expectOne((r: { url: string }) => r.url.includes('/comments'));
    req.flush(makePage([]));

    await view.fixture.whenStable();

    expect(view.getByTestId('comments-empty')).toBeTruthy();
    httpTesting.verify();
  });

  /**
   * La rama de error (`displayState() === 'error'`) la dispara el
   * `httpResource` re-lanzando el HTTP error aguas arriba dentro del
   * computed `displayState`. Ese rethrow es justo lo que motiva la
   * rama — pero no podemos observarlo desde un test unitario sin
   * reventar el runtime, porque `httpResource` re-lanza en cada
   * lectura de consumidor (incluido el effect que re-evalúa la
   * caché tras tirar la fixture).
   *
   * La UI de error se cubre end-to-end en `e2e/posts-crud.spec.ts`.
   */
  it.skip('renders the error state when the request fails', async () => {
    // Cubierto por la suite e2e — ver comentario arriba.
  });
});
