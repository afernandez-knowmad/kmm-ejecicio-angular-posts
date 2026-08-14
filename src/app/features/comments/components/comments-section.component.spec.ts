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
 * Build a `ServerPage`-shaped response that matches what
 * json-server v1-beta returns for paginated comments.
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
 * Stub UsersStore so its background fetch (used by other components
 * downstream) does not leave dangling requests behind. The comments
 * section does not depend on it.
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

    // Initial state: keyed off the cache (empty) and the resource
    // status, so we should see the loading state.
    expect(view.getByTestId('comments-loading')).toBeTruthy();

    // Flush the GET triggered by the httpResource with the paginated
    // shape json-server returns.
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
   * The error branch (`displayState() === 'error'`) is driven by
   * `httpResource` rethrowing the upstream HTTP error inside the
   * `displayState` computed. That rethrow is the whole point of the
   * branch — we just can't observe it from a unit test without
   * crashing the test runtime, because `httpResource` rethrows on
   * every consumer read (including the effect that re-evaluates the
   * cache after the fixture is torn down).
   *
   * The user-facing error UI is exercised end-to-end in
   * `e2e/posts-crud.spec.ts`.
   */
  it.skip('renders the error state when the request fails', async () => {
    // Covered by the e2e suite — see comment above.
  });
});
