import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';

import { QuoteWidgetComponent } from './shared/account/components/quote-widget/quote-widget.component';
import { QuoteWidgetContainerComponent } from './shared/account/containers/quote-widget/quote-widget.container';
import { BasketAddToQuoteComponent } from './shared/basket/components/basket-add-to-quote/basket-add-to-quote.component';
import { BasketAddToQuoteContainerComponent } from './shared/basket/containers/basket-add-to-quote/basket-add-to-quote.container';
import { ProductAddToQuoteDialogComponent } from './shared/product/components/product-add-to-quote-dialog/product-add-to-quote-dialog.component';
import { ProductAddToQuoteComponent } from './shared/product/components/product-add-to-quote/product-add-to-quote.component';
import { ProductAddToQuoteDialogContainerComponent } from './shared/product/containers/product-add-to-quote-dialog/product-add-to-quote-dialog.container';
import { ProductAddToQuoteContainerComponent } from './shared/product/containers/product-add-to-quote/product-add-to-quote.container';
import { QuoteEditComponent } from './shared/quote/components/quote-edit/quote-edit.component';
import { QuoteStateComponent } from './shared/quote/components/quote-state/quote-state.component';
import { QuotingStoreModule } from './store/quoting-store.module';

@NgModule({
  imports: [QuotingStoreModule, SharedModule],
  declarations: [
    BasketAddToQuoteComponent,
    BasketAddToQuoteContainerComponent,
    ProductAddToQuoteComponent,
    ProductAddToQuoteContainerComponent,
    ProductAddToQuoteDialogComponent,
    ProductAddToQuoteDialogContainerComponent,
    QuoteEditComponent,
    QuoteStateComponent,
    QuoteWidgetComponent,
    QuoteWidgetContainerComponent,
  ],
  exports: [QuoteEditComponent, QuoteStateComponent, SharedModule],
  entryComponents: [
    BasketAddToQuoteContainerComponent,
    ProductAddToQuoteContainerComponent,
    ProductAddToQuoteDialogContainerComponent,
    QuoteWidgetContainerComponent,
  ],
})
export class QuotingModule {}