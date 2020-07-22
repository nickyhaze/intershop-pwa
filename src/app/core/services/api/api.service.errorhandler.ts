import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, of, throwError } from 'rxjs';

import { HttpErrorMapper } from 'ish-core/models/http-error/http-error.mapper';
import { communicationTimeoutError, serverError } from 'ish-core/store/core/error';

@Injectable({ providedIn: 'root' })
export class ApiServiceErrorHandler {
  constructor(
    private store: Store,
    private errorHandler: ErrorHandler,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  // tslint:disable-next-line:ban-types
  dispatchCommunicationErrors<T>(error: HttpErrorResponse): Observable<T> {
    if (!isPlatformBrowser(this.platformId)) {
      this.errorHandler.handleError(error);
    }
    const mappedError = HttpErrorMapper.fromError(error);

    if (error.status === 0) {
      this.store.dispatch(communicationTimeoutError({ error: mappedError }));
      return EMPTY;
    }
    if (error.status >= 500 && error.status < 600) {
      this.store.dispatch(serverError({ error: mappedError }));
      return EMPTY;
    }
    return throwError(mappedError);
  }

  // tslint:disable-next-line: ban-types
  mapError<T>(error: HttpErrorResponse): Observable<T> {
    // re-cast for easier access
    return (of(HttpErrorMapper.fromError(error)) as unknown) as Observable<T>;
  }
}
