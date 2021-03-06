import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { ActionReducerMap, StoreModule } from '@ngrx/store';
import { pick } from 'lodash-es';

import { resetOnLogoutMeta } from 'ish-core/utils/meta-reducers';

import { ContentState } from './content-store';
import { IncludesEffects } from './includes/includes.effects';
import { includesReducer } from './includes/includes.reducer';
import { pageletsReducer } from './pagelets/pagelets.reducer';
import { PagesEffects } from './pages/pages.effects';
import { pagesReducer } from './pages/pages.reducer';

/** @deprecated will be made private in version 0.23 */
export const contentReducers: ActionReducerMap<ContentState> = {
  includes: includesReducer,
  pagelets: pageletsReducer,
  pages: pagesReducer,
};

// tslint:disable: deprecation

const contentEffects = [IncludesEffects, PagesEffects];

const metaReducers = [resetOnLogoutMeta];

@NgModule({
  imports: [
    EffectsModule.forFeature(contentEffects),
    StoreModule.forFeature('content', contentReducers, { metaReducers }),
  ],
})
export class ContentStoreModule {
  static forTesting(...reducers: (keyof ActionReducerMap<ContentState>)[]) {
    return StoreModule.forFeature('content', pick(contentReducers, reducers), { metaReducers });
  }
}
