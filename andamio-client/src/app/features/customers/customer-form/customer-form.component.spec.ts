import { Component, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { Location } from '@angular/common';
import { of, Subject, throwError } from 'rxjs';
import { CustomerFormComponent } from './customer-form.component';
import { CustomerService } from '../../../core/services/customer.service';
import { AddressAutocompleteComponent } from '../../../shared/components/address-autocomplete/address-autocomplete.component';

@Component({selector: 'app-address-autocomplete', standalone: true, template: ''})
class AddressStub { @Output() addressSelected = new EventEmitter(); }

// No network, Google Maps or database requests are made by these tests.
describe('CustomerFormComponent', () => {
  let fixture: ComponentFixture<CustomerFormComponent>;
  let component: CustomerFormComponent;
  let customers: jasmine.SpyObj<CustomerService>;
  let router: jasmine.SpyObj<Router>;
  let location: jasmine.SpyObj<Location>;
  let route: { snapshot: { paramMap: ReturnType<typeof convertToParamMap>; queryParamMap: ReturnType<typeof convertToParamMap> } };
  const saved = {id: 9, first_name: 'Cliente', last_name: 'Prueba', phone: '', address_id: 19, full_address: 'Calle ficticia'};

  beforeEach(async () => {
    customers = jasmine.createSpyObj('CustomerService', ['createCustomer', 'getCustomerById', 'updateCustomer']);
    customers.createCustomer.and.returnValue(of({success: true, data: {id: 9}}));
    customers.getCustomerById.and.returnValue(of({success: true, data: saved}));
    customers.updateCustomer.and.returnValue(of({success: true}));
    router = jasmine.createSpyObj('Router', ['navigate']);
    location = jasmine.createSpyObj('Location', ['back']);
    route = {snapshot: {paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({})}};
    await TestBed.configureTestingModule({imports: [CustomerFormComponent], providers: [
      {provide: CustomerService, useValue: customers}, {provide: Router, useValue: router},
      {provide: Location, useValue: location}, {provide: ActivatedRoute, useValue: route}
    ]}).overrideComponent(CustomerFormComponent, {
      remove: {imports: [AddressAutocompleteComponent]}, add: {imports: [AddressStub]}
    }).compileComponents();
    spyOn(window, 'alert');
  });

  function start(embedded = true) {
    fixture = TestBed.createComponent(CustomerFormComponent);
    component = fixture.componentInstance;
    component.embedded = embedded;
    fixture.detectChanges();
    component.customerForm.patchValue({first_name: 'Cliente', last_name: 'Prueba', address: 'Calle ficticia'});
  }

  it('ignores evaluation route IDs and uses manual addresses when embedded', () => {
    route.snapshot.paramMap = convertToParamMap({id: 44});
    start();
    expect(component.isEditMode).toBeFalse();
    expect(component.manualAddressMode).toBeTrue();
    expect(customers.getCustomerById).not.toHaveBeenCalled();
  });

  it('blocks invalid forms and cancellation never creates a customer', () => {
    start();
    component.customerForm.patchValue({first_name: '', address: ''});
    component.onSubmit();
    const cancel = spyOn(component.cancelled, 'emit');
    component.closeForm();
    expect(cancel).toHaveBeenCalled();
    expect(customers.createCustomer).not.toHaveBeenCalled();
  });

  it('blocks double submission and cancellation during saving', () => {
    const response = new Subject<any>();
    customers.createCustomer.and.returnValue(response);
    start();
    const cancel = spyOn(component.cancelled, 'emit');
    component.onSubmit(); component.onSubmit(); component.closeForm();
    expect(customers.createCustomer).toHaveBeenCalledTimes(1);
    expect(component.submitting).toBeTrue();
    expect(cancel).not.toHaveBeenCalled();
    response.next({success: true, data: {id: 9}}); response.complete();
    expect(component.submitting).toBeFalse();
  });

  it('emits the saved customer with its address, without navigating', () => {
    start(); const emit = spyOn(component.customerCreated, 'emit');
    component.onSubmit();
    expect(emit).toHaveBeenCalledWith(saved);
    expect(component.showEvaluationPrompt).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('retries retrieval after creation without creating duplicates', () => {
    customers.getCustomerById.and.returnValues(throwError(() => ({status: 500})), of({success: true, data: saved}));
    start(); const emit = spyOn(component.customerCreated, 'emit');
    component.onSubmit();
    expect(component.formError).toContain('ya se creó');
    component.onSubmit();
    expect(customers.createCustomer).toHaveBeenCalledTimes(1);
    expect(customers.getCustomerById).toHaveBeenCalledTimes(2);
    expect(emit).toHaveBeenCalledWith(saved);
  });

  it('does not accept a retrieved customer without an address', () => {
    customers.getCustomerById.and.returnValue(of({success: true, data: {...saved, address_id: undefined}}));
    start(); const emit = spyOn(component.customerCreated, 'emit');
    component.onSubmit(); component.onSubmit();
    expect(emit).not.toHaveBeenCalled();
    expect(customers.createCustomer).toHaveBeenCalledTimes(1);
    expect(component.formError).toContain('dirección');
  });

  it('blocks re-creation after an unconfirmed server response', () => {
    customers.createCustomer.and.returnValue(throwError(() => ({status: 500})));
    start(); component.onSubmit(); component.onSubmit();
    expect(component.creationUncertain).toBeTrue();
    expect(component.customerForm.value.first_name).toBe('Cliente');
    expect(customers.createCustomer).toHaveBeenCalledTimes(1);
  });

  it('allows correcting a rejected request without losing input', () => {
    customers.createCustomer.and.returnValues(throwError(() => ({status: 400})), of({success: true, data: {id: 9}}));
    start(); component.onSubmit();
    expect(component.creationUncertain).toBeFalse();
    expect(component.formError).toContain('No se pudo guardar');
    component.onSubmit();
    expect(customers.createCustomer).toHaveBeenCalledTimes(2);
  });

  it('blocks another POST when a successful response is missing the ID', () => {
    customers.createCustomer.and.returnValue(of({success: true}));
    start(); component.onSubmit(); component.onSubmit();
    expect(component.creationUncertain).toBeTrue();
    expect(customers.createCustomer).toHaveBeenCalledTimes(1);
  });

  it('preserves the standard creation prompt and schedule/skip actions', () => {
    start(false); component.onSubmit();
    expect(component.showEvaluationPrompt).toBeTrue();
    component.onScheduleEvaluation();
    expect(router.navigate).toHaveBeenCalledWith(['/evaluations/new'], {queryParams: {clientId: 9}});
    component.onSkipEvaluation(); expect(location.back).toHaveBeenCalled();
  });

  it('preserves the direct-quote creation route', () => {
    route.snapshot.queryParamMap = convertToParamMap({intent: 'quote'});
    start(false); component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/quotes/new/customer', 9]);
    expect(component.showEvaluationPrompt).toBeFalse();
  });

  it('preserves loading and updating a customer in the regular form', () => {
    route.snapshot.paramMap = convertToParamMap({id: 9});
    start(false); component.onSubmit();
    expect(component.isEditMode).toBeTrue();
    expect(customers.getCustomerById).toHaveBeenCalledWith(9);
    expect(customers.updateCustomer).toHaveBeenCalledWith(9, jasmine.any(Object));
    expect(location.back).toHaveBeenCalled();
    expect(customers.createCustomer).not.toHaveBeenCalled();
  });
  it('associates embedded validation errors with fields and clears them after correction', () => {
    start(); component.customerForm.patchValue({first_name: '', address: ''}); component.onSubmit(); fixture.detectChanges();
    for (const [field, id] of [['first_name', 'customer-name-error'], ['address', 'customer-address-error']]) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`[formcontrolname=${field}]`);
      expect(input.getAttribute('aria-required')).toBe('true'); expect(input.getAttribute('aria-invalid')).toBe('true');
      expect(input.getAttribute('aria-describedby')).toBe(id);
      expect(fixture.nativeElement.querySelector(`#${id}`).getAttribute('role')).toBe('alert');
    }
    component.customerForm.patchValue({first_name: 'Corregido', address: 'Calle ficticia'}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customer-name-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('#customer-address-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('#customer-first_name').getAttribute('aria-invalid')).toBe('false');
    expect(fixture.nativeElement.querySelector('#customer-address').hasAttribute('aria-describedby')).toBeFalse();
  });

  it('keeps embedded validation messages and ARIA changes out of the regular form', () => {
    start(false); component.toggleManualAddress();
    component.customerForm.patchValue({first_name: '', address: ''}); component.onSubmit(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#customer-name-error')).toBeNull();
    expect(fixture.nativeElement.querySelector('#customer-address-error')).toBeNull();
    for (const field of ['first_name', 'address']) {
      const input: HTMLInputElement = fixture.nativeElement.querySelector(`[formcontrolname=${field}]`);
      expect(input.hasAttribute('aria-invalid')).toBeFalse(); expect(input.hasAttribute('aria-required')).toBeFalse();
      expect(input.hasAttribute('aria-describedby')).toBeFalse();
    }
  });

  it('cancels embedded creation on destruction and never starts late recovery', () => {
    const pending = new Subject<any>(); customers.createCustomer.and.returnValue(pending);
    start(); component.onSubmit(); fixture.destroy(); expect(pending.observed).toBeFalse();
    pending.next({success: true, data: {id: 9}}); pending.complete();
    expect(customers.getCustomerById).not.toHaveBeenCalled(); expect(component.createdCustomerId).toBeUndefined();
  });

  it('cancels delayed recovery without emitting to the destroyed parent', () => {
    const pending = new Subject<any>(); customers.getCustomerById.and.returnValue(pending);
    start(); const emit = spyOn(component.customerCreated, 'emit'); component.onSubmit(); fixture.destroy();
    expect(pending.observed).toBeFalse(); pending.next({success: true, data: saved}); pending.complete(); expect(emit).not.toHaveBeenCalled();
  });

  it('cancels regular customer loading and ignores errors after leaving', () => {
    route.snapshot.paramMap = convertToParamMap({id: 9});
    const pending = new Subject<any>(); customers.getCustomerById.and.returnValue(pending);
    start(false); const before = component.customerForm.value; fixture.destroy(); expect(pending.observed).toBeFalse();
    pending.next({success: true, data: saved}); pending.error({status: 500});
    expect(component.customerForm.value).toEqual(before); expect(location.back).not.toHaveBeenCalled(); expect(window.alert).not.toHaveBeenCalled();
  });

  it('cancels regular customer updates without navigating after destruction', () => {
    route.snapshot.paramMap = convertToParamMap({id: 9});
    const pending = new Subject<any>(); customers.updateCustomer.and.returnValue(pending);
    start(false); component.onSubmit(); fixture.destroy(); expect(pending.observed).toBeFalse();
    pending.next({success: true}); pending.complete(); expect(location.back).not.toHaveBeenCalled(); expect(window.alert).not.toHaveBeenCalled();
  });

});
