import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store, select } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { race } from 'rxjs';
import {
  concatMap,
  debounceTime,
  filter,
  map,
  mapTo,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { ProductCompletenessLevel } from 'ish-core/models/product/product.model';
import { OrderService } from 'ish-core/services/order/order.service';
import { ofUrl, selectQueryParams, selectRouteParam } from 'ish-core/store/core/router';
import { setBreadcrumbData } from 'ish-core/store/core/viewconf';
import { continueCheckoutWithIssues, loadBasket } from 'ish-core/store/customer/basket';
import { getLoggedInUser } from 'ish-core/store/customer/user';
import { loadProductIfNotLoaded } from 'ish-core/store/shopping/products';
import { mapErrorToAction, mapToPayload, mapToPayloadProperty, whenTruthy } from 'ish-core/utils/operators';

import {
  createOrder,
  createOrderFail,
  createOrderSuccess,
  loadOrder,
  loadOrderByAPIToken,
  loadOrderFail,
  loadOrderSuccess,
  loadOrders,
  loadOrdersFail,
  loadOrdersSuccess,
  selectOrder,
  selectOrderAfterRedirect,
  selectOrderAfterRedirectFail,
} from './orders.actions';
import { getOrder, getSelectedOrder, getSelectedOrderId } from './orders.selectors';

@Injectable()
export class OrdersEffects {
  constructor(
    private actions$: Actions,
    private orderService: OrderService,
    private router: Router,
    private store: Store,
    private translateService: TranslateService
  ) {}

  /**
   * Creates an order based on the given basket.
   */
  createOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createOrder),
      mapToPayloadProperty('basketId'),
      mergeMap(basketId =>
        this.orderService.createOrder(basketId, true).pipe(
          map(order => createOrderSuccess({ order })),
          mapErrorToAction(createOrderFail)
        )
      )
    )
  );

  /**
   * After order creation either redirect to a payment provider or show checkout receipt page.
   */
  continueAfterOrderCreation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(createOrderSuccess),
        mapToPayloadProperty('order'),
        filter(order => !order || !order.orderCreation || order.orderCreation.status !== 'ROLLED_BACK'),
        tap(order => {
          if (
            order.orderCreation &&
            order.orderCreation.status === 'STOPPED' &&
            order.orderCreation.stopAction.type === 'Redirect' &&
            order.orderCreation.stopAction.redirectUrl
          ) {
            location.assign(order.orderCreation.stopAction.redirectUrl);
          } else {
            this.router.navigate(['/checkout/receipt']);
          }
        })
      ),
    { dispatch: false }
  );

  rollbackAfterOrderCreation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createOrderSuccess),
      mapToPayloadProperty('order'),
      filter(order => order.orderCreation && order.orderCreation.status === 'ROLLED_BACK'),
      tap(() => this.router.navigate(['/checkout/payment'], { queryParams: { error: true } })),
      concatMap(order => [
        loadBasket(),
        continueCheckoutWithIssues({
          targetRoute: undefined,
          basketValidation: {
            basket: undefined,
            results: {
              valid: false,
              adjusted: false,
              errors: order.infos,
            },
          },
        }),
      ])
    )
  );

  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrders),
      concatMap(() =>
        this.orderService.getOrders().pipe(
          map(orders => loadOrdersSuccess({ orders })),
          mapErrorToAction(loadOrdersFail)
        )
      )
    )
  );

  loadOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrder),
      mapToPayloadProperty('orderId'),
      concatMap(orderId =>
        this.orderService.getOrder(orderId).pipe(
          map(order => loadOrderSuccess({ order })),
          mapErrorToAction(loadOrderFail)
        )
      )
    )
  );

  /**
   * Loads an anonymous user`s order using the given api token and orderId.
   */
  loadOrderByAPIToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrderByAPIToken),
      mapToPayload(),
      concatMap(payload =>
        this.orderService.getOrderByToken(payload.orderId, payload.apiToken).pipe(
          map(order => loadOrderSuccess({ order })),
          mapErrorToAction(loadOrderFail)
        )
      )
    )
  );

  /**
   * Selects and loads an order.
   */
  loadOrderForSelectedOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectOrder),
      mapToPayloadProperty('orderId'),
      whenTruthy(),
      map(orderId => loadOrder({ orderId }))
    )
  );

  /**
   * Triggers a SelectOrder action if route contains orderId parameter ( for order detail page ).
   */
  routeListenerForSelectingOrder$ = createEffect(() =>
    this.store.pipe(
      ofUrl(/^\/(account\/orders.*|checkout\/receipt)/),
      select(selectRouteParam('orderId')),
      withLatestFrom(this.store.pipe(select(getSelectedOrderId))),
      filter(([fromAction, selectedOrderId]) => fromAction && fromAction !== selectedOrderId),
      map(([orderId]) => selectOrder({ orderId }))
    )
  );

  /**
   * After selecting and successfully loading an order, triggers a LoadProduct action
   * for each product that is missing in the current product entities state.
   */
  loadProductsForSelectedOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrderSuccess),
      mapToPayloadProperty('order'),
      switchMap(order => [
        ...order.lineItems.map(({ productSKU }) =>
          loadProductIfNotLoaded({ sku: productSKU, level: ProductCompletenessLevel.List })
        ),
      ])
    )
  );

  /**
   * Returning from redirect after checkout (before customer is logged in).
   * Waits until the customer is logged in and triggers the handleOrderAfterRedirect action afterwards.
   */
  returnFromRedirectAfterOrderCreation$ = createEffect(() =>
    this.store.pipe(
      ofUrl(/^\/checkout\/(receipt|payment)/),
      select(selectQueryParams),
      filter(({ redirect, orderId }) => redirect && orderId),
      switchMap(queryParams =>
        // SelectOrderAfterRedirect will be triggered either after a user is logged in or after the paid order is loaded (anonymous user)
        race([
          this.store.pipe(select(getLoggedInUser), whenTruthy(), take(1)),
          this.store.pipe(select(getOrder, { orderId: queryParams.orderId }), whenTruthy(), take(1)),
        ]).pipe(mapTo(selectOrderAfterRedirect({ params: queryParams })))
      )
    )
  );

  /**
   * Returning from redirect after checkout success case (after customer is logged in).
   * Sends success state with payment query params to the server and selects/loads order.
   */
  selectOrderAfterRedirect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectOrderAfterRedirect),
      mapToPayloadProperty('params'),
      concatMap(params =>
        this.orderService.updateOrderPayment(params.orderId, params).pipe(
          map(orderId => {
            if (params.redirect === 'success') {
              return selectOrder({ orderId });
            } else {
              return loadBasket();
            }
          }),
          mapErrorToAction(selectOrderAfterRedirectFail) // ToDo: display error message on receipt page
        )
      )
    )
  );

  selectOrderAfterRedirectFailed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(selectOrderAfterRedirectFail),
      tap(() =>
        this.router.navigate(['/checkout/payment'], {
          queryParams: { redirect: 'failure' },
        })
      ),
      mapTo(loadBasket())
    )
  );

  setOrderBreadcrumb$ = createEffect(() =>
    this.store.pipe(
      select(getSelectedOrder),
      whenTruthy(),
      debounceTime(0),
      withLatestFrom(this.translateService.get('account.orderdetails.breadcrumb')),
      map(([order, x]) =>
        setBreadcrumbData({
          breadcrumbData: [
            { key: 'account.order_history.link', link: '/account/orders' },
            { text: `${x} - ${order.documentNo}` },
          ],
        })
      )
    )
  );
}
