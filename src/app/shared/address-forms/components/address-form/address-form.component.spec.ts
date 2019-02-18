import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import * as using from 'jasmine-data-provider';

import { MockComponent } from 'ish-core/utils/dev/mock.component';

import { AddressFormComponent } from './address-form.component';

describe('Address Form Component', () => {
  let component: AddressFormComponent;
  let fixture: ComponentFixture<AddressFormComponent>;
  let element: HTMLElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AddressFormComponent,
        MockComponent({
          selector: 'ish-address-form-business',
          template: 'Business address form extension',
          inputs: ['addressForm'],
        }),
        MockComponent({
          selector: 'ish-address-form-de',
          template: 'German address form extension',
          inputs: ['addressForm', 'titles'],
        }),
        MockComponent({
          selector: 'ish-address-form-default',
          template: 'Default address form extension',
          inputs: ['addressForm', 'regions'],
        }),
        MockComponent({
          selector: 'ish-address-form-fr',
          template: 'French address form extension',
          inputs: ['addressForm', 'titles'],
        }),
        MockComponent({
          selector: 'ish-address-form-gb',
          template: 'British address form extension',
          inputs: ['addressForm', 'titles'],
        }),
        MockComponent({
          selector: 'ish-address-form-us',
          template: 'US address form extension',
          inputs: ['addressForm', 'regions'],
        }),
        MockComponent({
          selector: 'ish-input',
          template: 'Input component',
          inputs: ['controlName', 'form', 'label'],
        }),
        MockComponent({
          selector: 'ish-select-country',
          template: 'Country Select',
          inputs: ['countries', 'form', 'controlName'],
        }),
      ],
      imports: [ReactiveFormsModule, TranslateModule.forRoot()],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(AddressFormComponent);
        component = fixture.componentInstance;
        element = fixture.nativeElement;

        const form = new FormGroup({
          countryCodeSwitch: new FormControl(),
          phoneHome: new FormControl(),
        });

        component.parentForm = form;
      });
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
    expect(element).toBeTruthy();
    expect(() => fixture.detectChanges()).not.toThrow();
  });

  it('should throw an error if input parameter parentForm is missing', () => {
    component.parentForm = undefined;
    expect(() => fixture.detectChanges()).toThrow();
  });

  it("should set the default value 'address' if input parameter controlName is missing", () => {
    expect(component.controlName).toEqual('address');
  });

  it('should be rendered on creation and show countrySwitch and phoneHome', () => {
    fixture.detectChanges();
    expect(element.querySelector('ish-select-country[controlName=countryCodeSwitch]')).toBeTruthy();
    expect(element.querySelector('ish-input[controlName=phoneHome]')).toBeTruthy();
  });

  describe('dataprovider', () => {
    function dataProvider() {
      return [
        { countryCode: '', cmp: 'ish-address-form-default' },
        { countryCode: 'DE', cmp: 'ish-address-form-de' },
        { countryCode: 'FR', cmp: 'ish-address-form-fr' },
        { countryCode: 'GB', cmp: 'ish-address-form-gb' },
        { countryCode: 'US', cmp: 'ish-address-form-us' },
        { countryCode: 'BG', cmp: 'ish-address-form-default' },
      ];
    }

    using(dataProvider, dataSlice => {
      it(`should render \'${dataSlice.cmp}\' if countryCode equals \'${dataSlice.countryCode}\'`, () => {
        component.countryCode = dataSlice.countryCode;
        fixture.detectChanges();
        expect(element.querySelector(dataSlice.cmp)).toBeTruthy();
      });
    });
  });
});