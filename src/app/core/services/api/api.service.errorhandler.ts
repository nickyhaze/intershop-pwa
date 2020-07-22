import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, MonoTypeOperatorFunction, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HttpErrorMapper } from 'ish-core/models/http-error/http-error.mapper';
import { communicationTimeoutError, serverError } from 'ish-core/store/core/error';

@Injectable({ providedIn: 'root' })
export class ApiServiceErrorHandler {
  constructor(
    private store: Store,
    private errorHandler: ErrorHandler,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  handleErrors<T>(dispatch: boolean): MonoTypeOperatorFunction<T> {
    return catchError(error => {
      if (!isPlatformBrowser(this.platformId)) {
        this.errorHandler.handleError(error);
      }
      const mappedError = HttpErrorMapper.fromError(error);

      if (dispatch) {
        if (error.status === 0) {
          this.store.dispatch(communicationTimeoutError({ error: mappedError }));
          return EMPTY;
        } else if (error.status >= 500 && error.status < 600) {
          this.store.dispatch(serverError({ error: mappedError }));
          return EMPTY;
        }
      }
      return throwError(mappedError);
    });
  }
}
