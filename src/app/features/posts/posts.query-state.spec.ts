import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { PostsQueryState } from './posts.query-state';
import { DEFAULT_POST_LIST_QUERY } from './models/post-filters.model';
import { provideTestApp } from '@core/testing/test-providers';

describe('PostsQueryState', () => {
  let state: PostsQueryState;
  let router: Router;
  let route: ActivatedRoute;

  beforeEach(() => {
    // Provisionamos el router antes para que el spy esté instalado
    // antes de que el effect del constructor del servicio se dispare
    // por primera vez.
    TestBed.configureTestingModule({ providers: provideTestApp() });
    router = TestBed.inject(Router);
    route = TestBed.inject(ActivatedRoute);

    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    state = TestBed.inject(PostsQueryState);
  });

  it('starts with the default query', () => {
    expect(state.query()).toEqual(DEFAULT_POST_LIST_QUERY);
    expect(state.page()).toBe(DEFAULT_POST_LIST_QUERY.page);
    expect(state.pageSize()).toBe(DEFAULT_POST_LIST_QUERY.pageSize);
  });

  it('updates filters and resets to page 1', () => {
    state.setQuery({ page: 4 });
    state.setQuery({ q: 'angular' });

    expect(state.q()).toBe('angular');
    expect(state.page()).toBe(1);
  });

  it('keeps the current page when only `page` changes', () => {
    state.setQuery({ page: 3 });

    expect(state.page()).toBe(3);
  });

  it('exposes userId and tag computed signals', () => {
    state.setQuery({ userId: '2', tag: 'routing' });

    expect(state.userId()).toBe('2');
    expect(state.tag()).toBe('routing');
  });

  it('mirrors the query into the URL via router.navigate', async () => {
    // El effect de sync corre en el siguiente tick de change detection.
    await Promise.resolve();
    await Promise.resolve();

    state.setQuery({ q: 'http', userId: '2' });

    await vi.waitFor(() => {
      expect(router.navigate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          queryParams: expect.objectContaining({
            q: 'http',
            userId: '2',
          }),
          replaceUrl: true,
        }),
      );
    });
  });

  it('reads back the query from the URL via syncFromUrl', () => {
    const params: ParamMap = convertToParamMap({
      q: 'zoneless',
      userId: '3',
      page: '2',
      pageSize: '8',
    });
    vi.spyOn(route, 'snapshot', 'get').mockReturnValue({
      queryParamMap: params,
    } as never);

    state.syncFromUrl();

    expect(state.query()).toEqual({
      q: 'zoneless',
      userId: '3',
      tag: undefined,
      page: 2,
      pageSize: 8,
    });
  });

  it('rejects negative or non-numeric page numbers when reading from URL', () => {
    const params: ParamMap = convertToParamMap({ page: '-1', pageSize: 'abc' });
    vi.spyOn(route, 'snapshot', 'get').mockReturnValue({
      queryParamMap: params,
    } as never);

    state.syncFromUrl();

    expect(state.page()).toBe(DEFAULT_POST_LIST_QUERY.page);
    expect(state.pageSize()).toBe(DEFAULT_POST_LIST_QUERY.pageSize);
  });
});
