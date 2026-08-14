import { TestBed } from '@angular/core/testing';

import { CommentsStore } from './comments.store';
import { provideTestApp } from '@core/testing/test-providers';
import type { Comment } from './models/comment.model';

function makeComment(partial: Partial<Comment> & { id: string }): Comment {
  return {
    id: partial.id,
    postId: partial.postId ?? '1',
    userId: partial.userId ?? '1',
    body: partial.body ?? 'body',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
  };
}

describe('CommentsStore', () => {
  let store: CommentsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestApp() });
    store = TestBed.inject(CommentsStore);
  });

  it('starts empty for any postId', () => {
    expect(store.forPost(() => '1')()).toEqual([]);
  });

  it('observes a list of comments and indexes them by postId', () => {
    const c1 = makeComment({ id: 'a' });
    const c2 = makeComment({ id: 'b' });

    store.observe('1', [c1, c2]);

    expect(store.forPost(() => '1')()).toEqual([c1, c2]);
    expect(store.forPost(() => '99')()).toEqual([]);
  });

  it('sorts comments by createdAt descending on observe', () => {
    const older = makeComment({ id: 'older', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeComment({ id: 'newer', createdAt: '2026-02-01T00:00:00.000Z' });

    store.observe('1', [older, newer]);

    expect(
      store
        .forPost(() => '1')()
        .map((c) => c.id),
    ).toEqual(['newer', 'older']);
  });

  it('keeps reference stability when receiving the same list twice', () => {
    const c1 = makeComment({ id: 'a' });
    const c2 = makeComment({ id: 'b' });

    store.observe('1', [c1, c2]);
    const first = store.forPost(() => '1')();
    store.observe('1', [c1, c2]);
    const second = store.forPost(() => '1')();

    expect(second).toBe(first);
  });

  it('prepends a new comment to the top of the post bucket', () => {
    const existing = makeComment({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' });
    const fresh = makeComment({ id: 'new', createdAt: '2026-02-01T00:00:00.000Z' });

    store.observe('1', [existing]);
    store.prepend('1', fresh);

    expect(
      store
        .forPost(() => '1')()
        .map((c) => c.id),
    ).toEqual(['new', 'old']);
  });

  it('replaces a comment with the same id without losing the others', () => {
    store.observe('1', [
      makeComment({ id: 'a', body: 'before' }),
      makeComment({ id: 'b', body: 'b' }),
    ]);

    store.replace('1', makeComment({ id: 'a', body: 'after' }));

    const items = store.forPost(() => '1')();
    expect(items).toHaveLength(2);
    expect(items.find((c) => c.id === 'a')?.body).toBe('after');
    expect(items.find((c) => c.id === 'b')?.body).toBe('b');
  });

  it('removes a comment by id', () => {
    store.observe('1', [makeComment({ id: 'a' }), makeComment({ id: 'b' })]);

    store.remove('1', 'a');

    expect(
      store
        .forPost(() => '1')()
        .map((c) => c.id),
    ).toEqual(['b']);
  });

  it('clears a post bucket entirely', () => {
    store.observe('1', [makeComment({ id: 'a' })]);

    store.clear('1');

    expect(store.forPost(() => '1')()).toEqual([]);
  });

  it('does not refire observers when observe is a no-op (same content)', () => {
    const c1 = makeComment({ id: 'a' });

    store.observe('1', [c1]);
    const ref = store.forPost(() => '1')();

    store.observe('1', [c1]);
    expect(store.forPost(() => '1')()).toBe(ref);
  });
});
