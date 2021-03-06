import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import { instance, mock } from 'ts-mockito';

import { AccountFacade } from 'ish-core/facades/account.facade';

import { OrderTemplatesFacade } from '../../../facades/order-templates.facade';
import { OrderTemplatePreferencesDialogComponent } from '../../order-templates/order-template-preferences-dialog/order-template-preferences-dialog.component';
import { SelectOrderTemplateModalComponent } from '../../order-templates/select-order-template-modal/select-order-template-modal.component';

import { BasketCreateOrderTemplateComponent } from './basket-create-order-template.component';

describe('Basket Create Order Template Component', () => {
  let component: BasketCreateOrderTemplateComponent;
  let fixture: ComponentFixture<BasketCreateOrderTemplateComponent>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BasketCreateOrderTemplateComponent,
        MockComponent(OrderTemplatePreferencesDialogComponent),
        MockComponent(SelectOrderTemplateModalComponent),
      ],
      imports: [RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: OrderTemplatesFacade, useFactory: () => instance(mock(OrderTemplatesFacade)) },
        { provide: AccountFacade, useFactory: () => instance(mock(AccountFacade)) },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasketCreateOrderTemplateComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
