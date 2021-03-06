import { Inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { isEqual } from 'lodash-es';
import { distinctUntilChanged, filter, map, mapTo, mergeMap, switchMap, take } from 'rxjs/operators';

import {
  DEFAULT_PRODUCT_LISTING_VIEW_TYPE,
  PRODUCT_LISTING_ITEMS_PER_PAGE,
} from 'ish-core/configurations/injection-keys';
import { ProductListingMapper } from 'ish-core/models/product-listing/product-listing.mapper';
import { ProductListingView } from 'ish-core/models/product-listing/product-listing.model';
import { Product, ProductCompletenessLevel, ProductHelper } from 'ish-core/models/product/product.model';
import { ViewType } from 'ish-core/models/viewtype/viewtype.types';
import { ProductMasterVariationsService } from 'ish-core/services/product-master-variations/product-master-variations.service';
import { selectQueryParam, selectQueryParams } from 'ish-core/store/core/router';
import {
  applyFilter,
  loadFilterForCategory,
  loadFilterForSearch,
  loadFilterSuccess,
  loadProductsForFilter,
} from 'ish-core/store/shopping/filter';
import { getProduct, loadProductsForCategory } from 'ish-core/store/shopping/products';
import { searchProducts } from 'ish-core/store/shopping/search';
import { mapToPayload, whenFalsy, whenTruthy } from 'ish-core/utils/operators';
import { stringToFormParams } from 'ish-core/utils/url-form-params';

import {
  loadMoreProducts,
  loadMoreProductsForParams,
  loadPagesForMaster,
  setProductListingPageSize,
  setProductListingPages,
  setViewType,
} from './product-listing.actions';
import { getProductListingView, getProductListingViewType } from './product-listing.selectors';

@Injectable()
export class ProductListingEffects {
  constructor(
    @Inject(PRODUCT_LISTING_ITEMS_PER_PAGE) private itemsPerPage: number,
    @Inject(DEFAULT_PRODUCT_LISTING_VIEW_TYPE) private defaultViewType: ViewType,
    private actions$: Actions,
    private store: Store,
    private productListingMapper: ProductListingMapper,
    private productMasterVariationsService: ProductMasterVariationsService
  ) {}

  initializePageSize$ = createEffect(() =>
    this.actions$.pipe(take(1), mapTo(setProductListingPageSize({ itemsPerPage: this.itemsPerPage })))
  );

  initializeDefaultViewType$ = createEffect(() =>
    this.store.pipe(
      select(getProductListingViewType),
      whenFalsy(),
      mapTo(setViewType({ viewType: this.defaultViewType }))
    )
  );

  setViewTypeFromQueryParam$ = createEffect(() =>
    this.store.pipe(
      select(selectQueryParam('view')),
      whenTruthy(),
      distinctUntilChanged(),
      map((viewType: ViewType) => setViewType({ viewType }))
    )
  );

  /**
   * determine params for search & category pages
   *
   * case #1
   * refresh page (F5): initialPage is set by GET parameter "page" and will be used for the first time
   * (initial page)
   *
   * case #2
   * endless scroll: initialPage is resetted after first usage and params.page will be used for endless scroll
   *
   * extra
   * the result is also the cachekey for caching productlists in loadMoreProducts$
   */
  determineParams$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMoreProducts),
      mapToPayload(),
      switchMap(({ id, page }) => {
        let initialPage = page; // scope variable (reset after first usage)
        return this.store.pipe(
          select(selectQueryParams),
          map(params => {
            const filters = params.filters
              ? {
                  ...stringToFormParams(params.filters),
                  ...(id.type === 'search' ? { searchTerm: [id.value] } : {}),
                }
              : undefined;

            const p = initialPage || +params.page || undefined; // determine page

            initialPage = 0; // reset scope variable

            return {
              id: { ...id, filters },
              sorting: params.sorting || undefined,
              page: p > 1 ? p : undefined, // same content for 0, 1 & undefined
              filters,
            };
          })
        );
      }),
      distinctUntilChanged(isEqual),
      map(({ id, filters, sorting, page }) => loadMoreProductsForParams({ id, filters, sorting, page }))
    )
  );

  loadMoreProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMoreProductsForParams),
      mapToPayload(),
      switchMap(({ id, sorting, page, filters }) =>
        this.store.pipe(
          select(getProductListingView, { ...id, sorting, page, filters }),
          map((view: ProductListingView) => ({
            id,
            sorting,
            page,
            filters,
            viewAvailable: !view.empty() && view.productsOfPage(page).length,
          }))
        )
      ),
      distinctUntilChanged((a, b) => isEqual({ ...a, viewAvailable: undefined }, { ...b, viewAvailable: undefined })),
      map(({ id, sorting, page, filters, viewAvailable }) => {
        if (viewAvailable) {
          return setProductListingPages({ id: { page, sorting, filters, ...id } });
        }
        if (
          filters &&
          // TODO: work-around for different products/hits-result without filters
          (id.type !== 'search' || this.isSearchFor(filters.searchTerm, id)) &&
          // TODO: work-around for client side computation of master variations
          ['search', 'category'].includes(id.type)
        ) {
          const searchParameter = filters;
          return loadProductsForFilter({ id: { ...id, filters }, searchParameter, page, sorting });
        } else {
          switch (id.type) {
            case 'category':
              return loadProductsForCategory({ categoryId: id.value, page, sorting });
            case 'search':
              return searchProducts({ searchTerm: id.value, page, sorting });
            case 'master':
              return loadPagesForMaster({ id, sorting, filters });
            default:
              return;
          }
        }
      }),
      whenTruthy(),
      distinctUntilChanged(isEqual)
    )
  );

  loadFilters$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMoreProductsForParams),
      mapToPayload(),
      map(({ id, filters }) => ({ type: id.type, value: id.value, filters })),
      distinctUntilChanged(isEqual),
      map(({ type, value, filters }) => {
        if (
          filters &&
          // TODO: work-around for different products/hits-result without filters
          (type !== 'search' || this.isSearchFor(filters.searchTerm, { type, value })) &&
          // TODO: work-around for client side computation of master variations
          ['search', 'category'].includes(type)
        ) {
          const searchParameter = filters;
          return applyFilter({ searchParameter });
        } else {
          switch (type) {
            case 'category':
              return loadFilterForCategory({ uniqueId: value });
            case 'search':
              return loadFilterForSearch({ searchTerm: value });
            case 'master':
              return loadPagesForMaster({ id: { type, value }, sorting: undefined, filters });
            default:
              return;
          }
        }
      }),
      whenTruthy()
    )
  );

  /**
   * client side computation of master variations
   * TODO: this is a work-around
   */
  loadPagesForMaster$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPagesForMaster),
      mapToPayload(),
      switchMap(({ id, filters }) =>
        this.store.pipe(
          select(getProduct, { sku: id.value }),
          filter((p: Product) => ProductHelper.isSufficientlyLoaded(p, ProductCompletenessLevel.Detail)),
          filter(ProductHelper.hasVariations),
          filter(ProductHelper.isMasterProduct),
          take(1),
          mergeMap(product => {
            const {
              filterNavigation,
              products,
            } = this.productMasterVariationsService.getFiltersAndFilteredVariationsForMasterProduct(product, filters);

            return [
              setProductListingPages(
                this.productListingMapper.createPages(products, id.type, id.value, {
                  filters: filters ? filters : undefined,
                })
              ),
              loadFilterSuccess({ filterNavigation }),
            ];
          })
        )
      )
    )
  );

  private isSearchFor(searchTerm: string[], id: { type: string; value: string }): boolean {
    return id.type === 'search' && searchTerm && searchTerm.includes(id.value);
  }
}
