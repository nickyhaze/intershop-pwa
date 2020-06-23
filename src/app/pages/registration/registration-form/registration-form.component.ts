import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UUID } from 'angular2-uuid';
import { CustomValidators } from 'ng2-validation';

import { FeatureToggleService } from 'ish-core/feature-toggle.module';
import { Credentials } from 'ish-core/models/credentials/credentials.model';
import { Customer, CustomerRegistrationType } from 'ish-core/models/customer/customer.model';
import { HttpError } from 'ish-core/models/http-error/http-error.model';
import { User } from 'ish-core/models/user/user.model';
import { AddressFormFactoryProvider } from 'ish-shared/address-forms/configurations/address-form-factory.provider';
import { markAsDirtyRecursive, markFormControlsAsInvalid } from 'ish-shared/forms/utils/form-utils';
import { SpecialValidators } from 'ish-shared/forms/validators/special-validators';

@Component({
  selector: 'ish-registration-form',
  templateUrl: './registration-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationFormComponent implements OnInit, OnChanges {
  @Input() error: HttpError;

  @Output() create = new EventEmitter<CustomerRegistrationType>();
  @Output() cancel = new EventEmitter<void>();

  /** switch for business customer registration */
  businessCustomerRegistration: boolean;

  form: FormGroup;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private afs: AddressFormFactoryProvider,
    private featureToggle: FeatureToggleService
  ) {}

  ngOnInit() {
    // toggles business / private customer registration
    this.businessCustomerRegistration = this.featureToggle.enabled('businessCustomerRegistration');

    this.createRegistrationForm();
  }

  ngOnChanges(c: SimpleChanges) {
    this.applyError(c.error);
  }

  private createRegistrationForm(): void {
    this.form = this.fb.group({
      credentials: this.fb.group({
        login: ['', [Validators.required, CustomValidators.email]],
        loginConfirmation: ['', [Validators.required, CustomValidators.email]],
        password: ['', [Validators.required, SpecialValidators.password]],
        passwordConfirmation: ['', [Validators.required, SpecialValidators.password]],
      }),
      countryCodeSwitch: ['', [Validators.required]],
      preferredLanguage: ['en_US', [Validators.required]],
      birthday: [''],
      termsAndConditions: [false, [Validators.required, Validators.pattern('true')]],
      captcha: [''],
      captchaAction: ['register'],
      address: this.afs.getFactory('default').getGroup({ isBusinessAddress: this.businessCustomerRegistration }), // filled dynamically when country code changes
    });

    // set validators for credentials form
    const credForm = this.form.get('credentials');
    credForm.get('loginConfirmation').setValidators(CustomValidators.equalTo(credForm.get('login')));
    credForm.get('passwordConfirmation').setValidators(CustomValidators.equalTo(credForm.get('password')));

    // add form control(s) for business customers
    if (this.businessCustomerRegistration) {
      this.form.addControl('taxationID', new FormControl(''));
    }
  }

  private applyError(error: SimpleChange) {
    if (error && error.currentValue && error.currentValue.headers['error-missing-attributes']) {
      const missingAttributes = error.currentValue.headers['error-missing-attributes'];
      // map missing 'email' response to login field
      const list = missingAttributes.split(',').map(attr => (attr === 'email' ? 'credentials.login' : attr));
      markFormControlsAsInvalid(this.form, list);
    }
  }

  cancelForm() {
    this.cancel.emit();
  }

  /**
   * Submits form and throws create event when form is valid
   */
  submitForm() {
    if (this.form.invalid) {
      this.submitted = true;
      markAsDirtyRecursive(this.form);
      return;
    }

    const formValue = this.form.value;

    const address = formValue.address;

    const customer: Customer = {
      isBusinessCustomer: false,
      customerNo: UUID.UUID(), // TODO: customerNo should be generated by the server - IS-24884
    };

    const user: User = {
      title: formValue.address.title,
      firstName: formValue.address.firstName,
      lastName: formValue.address.lastName,
      email: formValue.credentials.login,
      phoneHome: formValue.address.phoneHome,
      birthday: formValue.birthday === '' ? undefined : formValue.birthday, // TODO: see IS-22276
      preferredLanguage: formValue.preferredLanguage,
    };

    const credentials: Credentials = {
      login: formValue.credentials.login,
      password: formValue.credentials.password,
    };

    if (this.businessCustomerRegistration) {
      customer.isBusinessCustomer = true;
      customer.companyName = formValue.address.companyName1;
      customer.companyName2 = formValue.address.companyName2;
      customer.taxationID = formValue.taxationID;
      user.businessPartnerNo = 'U' + customer.customerNo;
    }

    const registration: CustomerRegistrationType = { customer, user, credentials, address };
    registration.captcha = this.form.get('captcha').value;
    registration.captchaAction = this.form.get('captchaAction').value;

    this.create.emit(registration);
  }

  get formDisabled() {
    return this.form.invalid && this.submitted;
  }
}
